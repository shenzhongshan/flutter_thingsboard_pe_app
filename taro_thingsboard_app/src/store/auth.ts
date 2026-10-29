import * as authApi from '../api/auth'
import { getAllowedPermissions } from '../api/entities'
import { refreshJwtToken, session } from '../api/http'
import type { AllowedPermissionsInfo, HomeDashboardInfo, LoginResponse, User } from '../api/types'
import { buildNavigation, parsePageLayouts, type NavigationState } from '../core/navigation'
import { appEvents } from '../utils/events'
import { decodeJwt, isTokenExpired, type AuthUser } from '../utils/jwt'
import { createStore } from './createStore'
import { stopTracking } from './liveTracking'

/**
 * 登录状态，对应 Flutter 版 lib/core/auth/login/provider/login_provider.dart。
 */
export type AuthStatus = 'unknown' | 'unauthenticated' | 'twoFactor' | 'mfaSetupRequired' | 'authenticated'

export interface AuthState {
  status: AuthStatus
  authUser: AuthUser | null
  user: User | null
  permissions: AllowedPermissionsInfo | null
  homeDashboard: HomeDashboardInfo | null
  navigation: NavigationState
}

const emptyNavigation: NavigationState = { bottomBar: [], more: [] }

export const authStore = createStore<AuthState>({
  status: 'unknown',
  authUser: null,
  user: null,
  permissions: null,
  homeDashboard: null,
  navigation: emptyNavigation
})

function resetState(status: AuthStatus) {
  authStore.set({
    status,
    authUser: null,
    user: null,
    permissions: null,
    homeDashboard: null,
    navigation: emptyNavigation
  })
}

appEvents.on('unauthorized', () => {
  if (authStore.get().status !== 'unauthenticated') resetState('unauthenticated')
})

/** 加载用户信息、PE 权限与服务器下发的移动端布局。 */
export async function loadUser(): Promise<void> {
  const token = session.getToken()
  const authUser = token ? decodeJwt(token) : null
  if (!authUser) {
    resetState('unauthenticated')
    return
  }
  const [user, mobileInfo, permissions] = await Promise.all([
    authApi.getCurrentUser(),
    authApi.getUserMobileInfo().catch(() => null),
    // 系统管理员没有 RBAC 角色；接口失败时放行导航
    authUser.authority === 'SYS_ADMIN' ? Promise.resolve(null) : getAllowedPermissions().catch(() => null)
  ])
  const layouts = parsePageLayouts(mobileInfo?.pages)
  authStore.set({
    status: 'authenticated',
    authUser,
    user,
    permissions,
    homeDashboard: mobileInfo?.homeDashboardInfo?.dashboardId ? mobileInfo.homeDashboardInfo : null,
    navigation: buildNavigation(layouts, authUser.authority, permissions)
  })
}

/** 根据令牌类型决定下一步：2FA 验证 / 2FA 配置 / 进入主界面。 */
export async function applyLoginResponse(res: LoginResponse): Promise<AuthStatus> {
  session.setTokens(res.token, res.refreshToken)
  const authUser = decodeJwt(res.token)
  if (!authUser) {
    resetState('unauthenticated')
    return 'unauthenticated'
  }
  if (authUser.authority === 'PRE_VERIFICATION_TOKEN') {
    authStore.set({ status: 'twoFactor', authUser })
    return 'twoFactor'
  }
  if (authUser.authority === 'MFA_CONFIGURATION_TOKEN') {
    authStore.set({ status: 'mfaSetupRequired', authUser })
    return 'mfaSetupRequired'
  }
  await loadUser()
  return authStore.get().status
}

export async function loginWithPassword(username: string, password: string): Promise<AuthStatus> {
  const res = await authApi.login(username, password)
  return applyLoginResponse(res)
}

/** 应用启动时恢复会话。 */
export async function restoreSession(): Promise<AuthStatus> {
  const token = session.getToken()
  if (!token) {
    resetState('unauthenticated')
    return 'unauthenticated'
  }
  const authUser = decodeJwt(token)
  if (!authUser || authUser.authority === 'PRE_VERIFICATION_TOKEN' || authUser.authority === 'MFA_CONFIGURATION_TOKEN') {
    session.clearTokens()
    resetState('unauthenticated')
    return 'unauthenticated'
  }
  if (isTokenExpired(token) && !(await refreshJwtToken())) {
    session.clearTokens()
    resetState('unauthenticated')
    return 'unauthenticated'
  }
  try {
    await loadUser()
  } catch (_) {
    // 网络异常等：保留本地令牌，回到登录页由用户重试
    resetState('unauthenticated')
  }
  return authStore.get().status
}

export async function logout(): Promise<void> {
  // 先停止位置追踪：写入 gpsActive=false 需要仍然有效的令牌
  await stopTracking()
  await authApi.logout()
  resetState('unauthenticated')
}

export function useAuth<T>(selector: (s: AuthState) => T): T {
  return authStore.use(selector)
}

export function isTenantAdmin() {
  return authStore.get().authUser?.authority === 'TENANT_ADMIN'
}

export function isSysAdmin() {
  return authStore.get().authUser?.authority === 'SYS_ADMIN'
}

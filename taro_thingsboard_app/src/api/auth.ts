import {
  FALLBACK_PKG_NAME,
  FALLBACK_PLATFORM,
  MOBILE_PKG_NAME_OVERRIDE,
  MOBILE_PLATFORM_OVERRIDE,
  WECHAT_PLATFORM
} from '../config'
import { getAppId } from '../utils/appInfo'
import { ApiError, http, session } from './http'
import type { LoginMobileInfo, LoginResponse, TwoFaProviderInfo, User, UserMobileInfo } from './types'

/** 认证相关接口，对应 Flutter 版 lib/core/auth/**。 */

export function login(username: string, password: string) {
  return http.post<LoginResponse>('/api/auth/login', { username, password }, { auth: false })
}

export async function logout() {
  try {
    await http.post('/api/auth/logout', undefined, { silent: true })
  } catch (_) {
    // 服务器侧登出失败不影响本地清理
  }
  session.clearTokens()
}

export function getCurrentUser() {
  return http.get<User>('/api/auth/user')
}

export function requestResetPasswordByEmail(email: string) {
  return http.post('/api/noauth/resetPasswordByEmail', { email }, { auth: false })
}

export function changePassword(currentPassword: string, newPassword: string) {
  return http.post<LoginResponse | null>('/api/auth/changePassword', { currentPassword, newPassword })
}

/* ---------- 移动中心 ---------- */

/** 不支持 WECHAT_MINIPROGRAM 平台的服务器（按服务器地址记录），改用 ANDROID 平台查询。 */
const legacyServers = new Set<string>()

interface MobileParams {
  pkgName: string
  platform: string
}

/**
 * 以小程序 AppID + WECHAT_MINIPROGRAM 查询移动中心；原版 ThingsBoard 不认识该平台会返回 400，
 * 此时回退为 ANDROID 平台（包名默认 org.thingsboard.pe.miniprogram，可用 TB_MOBILE_PKG_NAME 覆盖）。
 */
async function withMobileParams<T>(call: (params: MobileParams) => Promise<T>): Promise<T> {
  if (MOBILE_PLATFORM_OVERRIDE) {
    return call({ pkgName: getAppId(), platform: MOBILE_PLATFORM_OVERRIDE })
  }
  const endpoint = session.getEndpoint()
  if (!legacyServers.has(endpoint)) {
    try {
      return await call({ pkgName: getAppId(), platform: WECHAT_PLATFORM })
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 400) throw e
      legacyServers.add(endpoint)
    }
  }
  return call({ pkgName: MOBILE_PKG_NAME_OVERRIDE || FALLBACK_PKG_NAME, platform: FALLBACK_PLATFORM })
}

/** 登录页信息：OAuth2 客户端、版本信息等（/api/noauth/mobile）。 */
export function getLoginMobileInfo() {
  return withMobileParams((params) =>
    http.get<LoginMobileInfo>('/api/noauth/mobile', { ...params }, { auth: false, silent: true })
  )
}

/** 登录后的移动端布局：底部导航页面、首页仪表板、版本信息（/api/mobile）。 */
export function getUserMobileInfo() {
  return withMobileParams((params) => http.get<UserMobileInfo>('/api/mobile', { ...params }, { silent: true }))
}

/* ---------- 双因素认证（2FA） ---------- */

export function getAvailableTwoFaProviders() {
  return http.get<TwoFaProviderInfo[]>('/api/auth/2fa/providers')
}

export function requestTwoFaVerificationCode(providerType: string) {
  return http.post('/api/auth/2fa/verification/send', undefined, { query: { providerType } })
}

export function checkTwoFaVerificationCode(providerType: string, verificationCode: string) {
  return http.post<LoginResponse>('/api/auth/2fa/verification/check', undefined, {
    query: { providerType, verificationCode }
  })
}

/* ---------- 扫码登录 ---------- */

/** 用二维码中的一次性 secret 换取令牌（/api/noauth/qr/{secret}）。 */
export function exchangeQrSecret(host: string, secret: string) {
  return http.get<LoginResponse>(`/api/noauth/qr/${encodeURIComponent(secret)}`, undefined, {
    auth: false,
    baseUrl: host
  })
}

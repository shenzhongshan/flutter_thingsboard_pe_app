import { MOBILE_PKG_NAME, MOBILE_PLATFORM } from '../config'
import { http, session } from './http'
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

/** 登录页信息：OAuth2 客户端、自助注册参数等（/api/noauth/mobile）。 */
export function getLoginMobileInfo() {
  return http.get<LoginMobileInfo>(
    '/api/noauth/mobile',
    { pkgName: MOBILE_PKG_NAME, platform: MOBILE_PLATFORM },
    { auth: false, silent: true }
  )
}

/** 登录后的移动端布局：底部导航页面、首页仪表板（/api/mobile）。 */
export function getUserMobileInfo() {
  return http.get<UserMobileInfo>(
    '/api/mobile',
    { pkgName: MOBILE_PKG_NAME, platform: MOBILE_PLATFORM },
    { silent: true }
  )
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

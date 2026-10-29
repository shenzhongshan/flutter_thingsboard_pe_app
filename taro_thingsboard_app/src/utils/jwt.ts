import { base64Decode } from './base64'

export type Authority =
  | 'SYS_ADMIN'
  | 'TENANT_ADMIN'
  | 'CUSTOMER_USER'
  | 'REFRESH_TOKEN'
  | 'PRE_VERIFICATION_TOKEN'
  | 'MFA_CONFIGURATION_TOKEN'

/** JWT 中携带的用户信息，对应 thingsboard_client 的 AuthUser。 */
export interface AuthUser {
  sub: string
  scopes: Authority[]
  userId: string
  firstName?: string
  lastName?: string
  enabled?: boolean
  isPublic?: boolean
  tenantId?: string
  customerId?: string
  exp: number
  iat?: number
  authority: Authority
}

export function decodeJwt(token: string): AuthUser | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    const claims = JSON.parse(base64Decode(payload))
    const scopes: Authority[] = claims.scopes || []
    return { ...claims, scopes, authority: scopes[0] }
  } catch (_) {
    return null
  }
}

/** 令牌是否已过期（提前 skewSeconds 秒视为过期，以便提前刷新）。 */
export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const user = decodeJwt(token)
  if (!user || !user.exp) return true
  return Date.now() / 1000 >= user.exp - skewSeconds
}

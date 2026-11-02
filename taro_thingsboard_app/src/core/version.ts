/**
 * 版本检查，对应 Flutter 版 lib/utils/services/version_service：
 * 当前版本低于移动中心配置的「最低版本」时必须更新，低于「最新版本」时提示可更新。
 */

export interface MobileVersionInfo {
  minVersion?: string | null
  minVersionReleaseNotes?: string | null
  latestVersion?: string | null
  latestVersionReleaseNotes?: string | null
}

export type UpdateStatus = 'required' | 'available' | 'none'

/** 解析 x.y.z（忽略预发布与构建后缀）；无法解析返回 null。 */
export function parseVersion(v?: string | null): number[] | null {
  if (!v) return null
  const m = /^\s*v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/.exec(v)
  if (!m) return null
  return [Number(m[1]), Number(m[2] || 0), Number(m[3] || 0)]
}

/** a < b 返回负数，相等返回 0，a > b 返回正数；任一无法解析视为相等。 */
export function compareVersions(a?: string | null, b?: string | null): number {
  const va = parseVersion(a)
  const vb = parseVersion(b)
  if (!va || !vb) return 0
  for (let i = 0; i < 3; i++) {
    if (va[i] !== vb[i]) return va[i] - vb[i]
  }
  return 0
}

export function checkUpdate(current: string, info?: MobileVersionInfo | null): UpdateStatus {
  if (!info) return 'none'
  if (info.minVersion && compareVersions(current, info.minVersion) < 0) return 'required'
  if (info.latestVersion && compareVersions(current, info.latestVersion) < 0) return 'available'
  return 'none'
}

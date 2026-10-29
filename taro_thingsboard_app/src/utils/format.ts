function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`
}

export function formatDateTime(ts?: number | null): string {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}:${pad(d.getSeconds())}`
}

export function formatDate(ts?: number | null): string {
  if (!ts) return '-'
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** 相对时间，例如 “3 分钟前”，与 Flutter 版通知/告警列表展示一致。 */
export function timeAgo(ts?: number | null, now: number = Date.now()): string {
  if (!ts) return '-'
  const diff = Math.max(0, Math.floor((now - ts) / 1000))
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)} 天前`
  return formatDate(ts)
}

export function fullName(user?: { firstName?: string | null; lastName?: string | null; email?: string | null } | null): string {
  if (!user) return ''
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
  return name || user.email || ''
}

export function initials(text?: string | null): string {
  if (!text) return '?'
  const parts = text.trim().split(/\s+/)
  const chars = parts.length > 1 ? parts[0][0] + parts[1][0] : text.trim().slice(0, 2)
  return chars.toUpperCase()
}

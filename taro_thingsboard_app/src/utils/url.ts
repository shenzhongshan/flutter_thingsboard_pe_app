export function buildQuery(params: Record<string, unknown>): string {
  const parts: string[] = []
  Object.keys(params).forEach((key) => {
    const value = params[key]
    if (value === undefined || value === null || value === '') return
    if (Array.isArray(value)) {
      if (value.length === 0) return
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value.join(','))}`)
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
    }
  })
  return parts.join('&')
}

export function withQuery(path: string, params: Record<string, unknown>): string {
  const query = buildQuery(params)
  if (!query) return path
  return `${path}${path.includes('?') ? '&' : '?'}${query}`
}

export interface ParsedUrl {
  origin: string
  path: string
  query: Record<string, string>
}

/** 简易 URL 解析（小程序环境下没有 URL 构造函数）。 */
export function parseUrl(url: string): ParsedUrl | null {
  const match = /^(https?:\/\/[^/?#]+)([^?#]*)(\?[^#]*)?/i.exec(url.trim())
  if (!match) return null
  const query: Record<string, string> = {}
  const search = (match[3] || '').replace(/^\?/, '')
  search
    .split('&')
    .filter(Boolean)
    .forEach((pair) => {
      const idx = pair.indexOf('=')
      const k = idx >= 0 ? pair.slice(0, idx) : pair
      const v = idx >= 0 ? pair.slice(idx + 1) : ''
      try {
        query[decodeURIComponent(k)] = decodeURIComponent(v.replace(/\+/g, ' '))
      } catch (_) {
        query[k] = v
      }
    })
  return { origin: match[1].toLowerCase(), path: match[2] || '/', query }
}

/** 规范化用户输入的服务器地址：补全协议、去掉末尾斜杠。 */
export function normalizeEndpoint(input: string): string {
  let value = input.trim()
  if (!value) return ''
  if (!/^https?:\/\//i.test(value)) value = `https://${value}`
  return value.replace(/\/+$/, '')
}

/**
 * 读取页面参数：不同平台对 query 是否已解码的行为不一致，
 * 这里仅在仍包含 %XX 转义时解码一次。
 */
export function readParam(value?: string): string {
  if (!value) return ''
  if (!/%[0-9A-Fa-f]{2}/.test(value)) return value
  try {
    return decodeURIComponent(value)
  } catch (_) {
    return value
  }
}

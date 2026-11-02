import Taro from '@tarojs/taro'
import { FIXED_API_ENDPOINT } from '../config'
import { appEvents } from '../utils/events'
import { isTokenExpired } from '../utils/jwt'
import { StorageKeys, getItem, removeItem, setItem } from '../utils/storage'
import { withQuery } from '../utils/url'

/**
 * ThingsBoard REST 客户端，对应 Flutter 版 thingsboard_pe_client 的 ThingsboardClient：
 * 负责拼接服务器地址、携带 X-Authorization 令牌、令牌过期自动刷新以及统一错误处理。
 */

export class ApiError extends Error {
  status: number
  errorCode?: number
  data?: any

  constructor(message: string, status: number, data?: any) {
    super(message)
    this.status = status
    this.data = data
    this.errorCode = data?.errorCode
  }
}

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE'

export interface RequestOptions {
  method?: Method
  query?: Record<string, unknown>
  data?: unknown
  /** 是否携带令牌，默认 true；/api/noauth/** 等匿名接口传 false。 */
  auth?: boolean
  /** 静默请求：失败时不弹出错误提示（对应 Flutter 版 silentRequestExtra）。 */
  silent?: boolean
  /** 覆盖服务器地址（扫码登录切换服务器时使用）。 */
  baseUrl?: string
  /** 令牌覆盖（如 2FA 阶段使用预验证令牌）。 */
  token?: string
}

let endpoint: string = getItem<string>(StorageKeys.endpoint) || FIXED_API_ENDPOINT || ''
let jwtToken: string | undefined = getItem<string>(StorageKeys.token)
let refreshToken: string | undefined = getItem<string>(StorageKeys.refreshToken)
let refreshing: Promise<boolean> | null = null

export const session = {
  getEndpoint: () => endpoint,
  setEndpoint(value: string) {
    endpoint = value
    setItem(StorageKeys.endpoint, value)
  },
  getToken: () => jwtToken,
  getRefreshToken: () => refreshToken,
  setTokens(token: string, refresh?: string | null) {
    jwtToken = token
    refreshToken = refresh || undefined
    setItem(StorageKeys.token, token)
    if (refresh) setItem(StorageKeys.refreshToken, refresh)
    else removeItem(StorageKeys.refreshToken)
  },
  clearTokens() {
    jwtToken = undefined
    refreshToken = undefined
    removeItem(StorageKeys.token)
    removeItem(StorageKeys.refreshToken)
  }
}

function errorMessage(status: number, data: any): string {
  if (data && typeof data === 'object' && data.message) return String(data.message)
  if (typeof data === 'string' && data) return data
  if (status === 0) {
    const raw = String(data?.message || '')
    if (raw.includes('url not in domain list')) {
      return '服务器地址不在小程序合法域名列表中：开发时请在开发者工具勾选「不校验合法域名」或在手机上打开「开发调试」'
    }
    return '无法连接到服务器，请检查网络或服务器地址'
  }
  if (status === 401) return '会话已过期，请重新登录'
  if (status === 403) return '没有权限执行该操作'
  if (status === 404) return '请求的资源不存在'
  return `请求失败 (${status})`
}

async function rawRequest(url: string, method: Method, data: unknown, header: Record<string, string>) {
  try {
    const res = await Taro.request({
      url,
      method,
      data: data as any,
      header,
      dataType: 'json',
      timeout: 30000
    })
    return { status: res.statusCode, data: res.data }
  } catch (e: any) {
    return { status: 0, data: { message: e?.errMsg || e?.message } }
  }
}

/** 使用 refreshToken 换取新令牌，并发调用时只发一次请求。 */
export function refreshJwtToken(): Promise<boolean> {
  if (!refreshToken) return Promise.resolve(false)
  if (!refreshing) {
    const current = refreshToken
    refreshing = rawRequest(`${endpoint}/api/auth/token`, 'POST', { refreshToken: current }, {
      'Content-Type': 'application/json'
    })
      .then((res) => {
        if (res.status === 200 && res.data?.token) {
          session.setTokens(res.data.token, res.data.refreshToken)
          return true
        }
        return false
      })
      .finally(() => {
        refreshing = null
      })
  }
  return refreshing
}

function handleUnauthorized() {
  session.clearTokens()
  appEvents.emit('unauthorized', undefined)
}

export async function request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, data, auth = true, silent = false, baseUrl, token } = options
  const base = baseUrl ?? endpoint
  if (!base) throw new ApiError('未配置服务器地址', 0)

  if (auth && !token && jwtToken && refreshToken && isTokenExpired(jwtToken)) {
    const ok = await refreshJwtToken()
    if (!ok) {
      handleUnauthorized()
      throw new ApiError(errorMessage(401, null), 401)
    }
  }

  const url = `${base}${withQuery(path, query || {})}`
  const doRequest = () => {
    const header: Record<string, string> = { 'Content-Type': 'application/json' }
    const bearer = token ?? (auth ? jwtToken : undefined)
    if (bearer) header['X-Authorization'] = `Bearer ${bearer}`
    return rawRequest(url, method, data, header)
  }

  let res = await doRequest()
  if (res.status === 401 && auth && !token) {
    // 服务器判定令牌失效：尝试刷新一次后重放请求
    const ok = await refreshJwtToken()
    if (ok) {
      res = await doRequest()
    }
    if (res.status === 401) {
      handleUnauthorized()
    }
  }

  if (res.status >= 200 && res.status < 300) {
    return res.data as T
  }

  const err = new ApiError(errorMessage(res.status, res.data), res.status, res.data)
  // 已登录请求的 401 会跳转登录页，无需提示；登录接口等匿名请求的 401（如密码错误）需要提示
  if (!silent && (res.status !== 401 || !auth || !!token)) {
    if (err.message.length > 40) {
      Taro.showModal({ title: '请求失败', content: err.message, showCancel: false })
    } else {
      Taro.showToast({ title: err.message, icon: 'none', duration: 2500 })
    }
  }
  throw err
}

export const http = {
  get: <T = any>(path: string, query?: Record<string, unknown>, opts: RequestOptions = {}) =>
    request<T>(path, { ...opts, method: 'GET', query }),
  post: <T = any>(path: string, data?: unknown, opts: RequestOptions = {}) =>
    request<T>(path, { ...opts, method: 'POST', data }),
  put: <T = any>(path: string, data?: unknown, opts: RequestOptions = {}) =>
    request<T>(path, { ...opts, method: 'PUT', data }),
  delete: <T = any>(path: string, opts: RequestOptions = {}) => request<T>(path, { ...opts, method: 'DELETE' })
}

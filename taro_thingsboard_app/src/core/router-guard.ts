/** 回到登录页前的去重判定，对应 utils/router.ts 的 relaunchToLogin。 */
export interface LoginRelaunchState {
  /** 上一次 reLaunch 尚未结束 */
  inFlight: boolean
  /** 当前页面栈深度 */
  pageCount: number
  /** 栈顶页面路由 */
  currentRoute: string
}

/**
 * 登出、401 事件与主页面的状态监听可能在同一时刻触发跳转，需要去重。
 *
 * 去重不能基于时间窗：上一次跳转结束后，任何一次新的登出都必须能再跳转，
 * 否则主页面会一直停在 splash 且没有重试路径。因此只在「跳转进行中」或
 * 「已经停在登录页」时跳过。
 */
export function shouldRelaunchToLogin(state: LoginRelaunchState): boolean {
  if (state.inFlight) return false
  if (state.pageCount === 1 && state.currentRoute.includes('pages/login')) return false
  return true
}

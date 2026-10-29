import Taro from '@tarojs/taro'
import type { NavTarget } from '../core/navigation'
import { base64Encode } from './base64'
import { withQuery } from './url'

/** 页面路由表与跳转辅助函数，对应 Flutter 版 ThingsboardAppRouter。 */
export const Routes = {
  login: '/pages/login/index',
  region: '/pages/region/index',
  twoFactor: '/pages/two-factor/index',
  resetPassword: '/pages/reset-password/index',
  main: '/pages/main/index',
  section: '/pages/section/index',
  alarmDetail: '/pages/alarm-detail/index',
  alarmFilter: '/pages/alarm-filter/index',
  deviceDetail: '/pages/device-detail/index',
  entityDetail: '/pages/entity-detail/index',
  dashboard: '/pages/dashboard/index',
  webview: '/pages/webview/index',
  profile: '/pages/profile/index',
  changePassword: '/pages/change-password/index',
  liveTracking: '/pages/live-tracking/index'
} as const

export function go(path: string, params: Record<string, unknown> = {}) {
  return Taro.navigateTo({ url: withQuery(path, params) })
}

export function relaunch(path: string, params: Record<string, unknown> = {}) {
  return Taro.reLaunch({ url: withQuery(path, params) })
}

export function openDashboard(dashboardId: string, title?: string, opts: { state?: string; hideToolbar?: boolean } = {}) {
  return go(Routes.dashboard, { id: dashboardId, title, state: opts.state, hideToolbar: opts.hideToolbar ? 1 : undefined })
}

export function openUrl(url: string, title?: string) {
  // 以 base64 传递，避免链接自身的 %XX 转义在不同平台上被重复解码
  return go(Routes.webview, { u: base64Encode(url), title })
}

/** 打开导航项：内置页面在 section 容器中打开，仪表板 / 外链使用 web-view。 */
export function openNavTarget(target: NavTarget, title?: string) {
  switch (target.kind) {
    case 'view':
      if (target.view === 'profile') return go(Routes.profile)
      if (target.view === 'live_location_tracking') return go(Routes.liveTracking)
      return go(Routes.section, { view: target.view, title })
    case 'dashboard':
      return openDashboard(target.dashboardId, title)
    case 'url':
      return openUrl(target.url, title)
    default:
      Taro.showToast({ title: `暂不支持的页面: ${target.path}`, icon: 'none' })
      return Promise.resolve()
  }
}

let lastLoginRelaunch = 0

/** 回到登录页。登出、401、主页面状态监听可能同时触发，这里去重避免重复 reLaunch。 */
export function relaunchToLogin() {
  const now = Date.now()
  if (now - lastLoginRelaunch < 1500) return
  lastLoginRelaunch = now
  const pages = Taro.getCurrentPages()
  const current = pages[pages.length - 1]?.route || ''
  if (pages.length === 1 && current.includes('pages/login')) return
  Taro.reLaunch({ url: Routes.login })
}

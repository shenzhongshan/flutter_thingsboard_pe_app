import type { AllowedPermissionsInfo, PageLayoutJson } from '../api/types'
import type { Authority } from '../utils/jwt'
import { hasReadGenericOrSharedGroupsPermission, hasReadGenericPermission } from './permissions'

/**
 * 主导航（底部栏 + 更多菜单）生成逻辑，移植自 Flutter 版
 * lib/modules/main/providers/navigation_provider.dart 与 navigation_helper.dart。
 */

export type PageId =
  | 'home'
  | 'alarms'
  | 'devices'
  | 'customers'
  | 'assets'
  | 'audit_logs'
  | 'notifications'
  | 'device_list'
  | 'dashboards'
  | 'live_location_tracking'

export const PAGE_IDS: PageId[] = [
  'home',
  'alarms',
  'devices',
  'customers',
  'assets',
  'audit_logs',
  'notifications',
  'device_list',
  'dashboards',
  'live_location_tracking'
]

/** 小程序内的导航目标。 */
export type NavTarget =
  | { kind: 'view'; view: PageId | 'more' | 'profile' | 'tenants' }
  | { kind: 'dashboard'; dashboardId: string }
  | { kind: 'url'; url: string }
  | { kind: 'unknown'; path: string }

export interface NavItem {
  key: string
  title: string
  icon: string
  target: NavTarget
  showNotificationBadge?: boolean
}

export interface PageLayout {
  id?: PageId
  label?: string
  icon?: string
  dashboardId?: string
  path?: string
  url?: string
}

export const PAGE_TITLES: Record<PageId, string> = {
  home: '首页',
  alarms: '告警',
  devices: '设备',
  customers: '客户',
  assets: '资产',
  audit_logs: '审计日志',
  notifications: '通知',
  device_list: '设备列表',
  dashboards: '仪表板',
  live_location_tracking: '实时位置追踪'
}

const PAGE_ICONS: Record<PageId, string> = {
  home: 'home',
  alarms: 'notifications',
  devices: 'devices_other',
  customers: 'supervisor_account',
  assets: 'domain',
  audit_logs: 'track_changes',
  notifications: 'notifications_active',
  device_list: 'devices',
  dashboards: 'dashboard',
  live_location_tracking: 'my_location'
}

export function pageIdFromString(value?: string | null): PageId | undefined {
  if (!value) return undefined
  const lower = value.toLowerCase()
  return PAGE_IDS.find((id) => id === lower)
}

export function parsePageLayouts(pages: PageLayoutJson[] | null | undefined): PageLayout[] | null {
  if (!pages || !Array.isArray(pages)) return null
  return pages
    .filter((p) => p && typeof p === 'object' && p.visible !== false)
    .map((p) => ({
      id: pageIdFromString(p.id),
      label: p.label || undefined,
      icon: p.icon || undefined,
      dashboardId: p.dashboardId || undefined,
      path: p.path || undefined,
      url: p.url || undefined
    }))
}

/** 服务器未下发布局时，按用户角色生成默认页面（与 Flutter 版 _cachePageLayouts 一致）。 */
export function defaultPageLayouts(authority: Authority): PageLayout[] {
  const pages: PageLayout[] = [{ id: 'home' }, { id: 'alarms' }, { id: 'devices' }]
  if (authority === 'SYS_ADMIN') {
    return [{ id: 'home' }, { id: 'devices' }, { id: 'notifications' }]
  }
  if (authority === 'TENANT_ADMIN') {
    pages.push({ id: 'customers' }, { id: 'assets' }, { id: 'audit_logs' }, { id: 'notifications' })
  } else if (authority === 'CUSTOMER_USER') {
    pages.push({ id: 'assets' }, { id: 'notifications' })
  }
  return pages
}

/** 页面是否对当前用户可见，对应 NavigationHelper.isPageVisible。 */
export function isPageVisible(
  page: PageLayout,
  authority: Authority | undefined,
  permissions: AllowedPermissionsInfo | null | undefined
): boolean {
  if (authority === 'SYS_ADMIN') return true
  // 权限尚未加载时放行，避免导航被锁死
  if (!permissions) return true
  switch (page.id) {
    case 'alarms':
      return hasReadGenericPermission(permissions, 'ALARM')
    case 'devices':
      return hasReadGenericPermission(permissions, 'DEVICE_PROFILE')
    case 'device_list':
      return hasReadGenericOrSharedGroupsPermission(permissions, 'DEVICE', 'DEVICE')
    case 'assets':
      return hasReadGenericOrSharedGroupsPermission(permissions, 'ASSET', 'ASSET')
    case 'customers':
      return hasReadGenericOrSharedGroupsPermission(permissions, 'CUSTOMER', 'CUSTOMER')
    case 'dashboards':
      return hasReadGenericOrSharedGroupsPermission(permissions, 'DASHBOARD', 'DASHBOARD')
    case 'audit_logs':
      return hasReadGenericPermission(permissions, 'AUDIT_LOG')
    default:
      return true
  }
}

export function navTargetForLayout(page: PageLayout): NavTarget {
  if (page.id) return { kind: 'view', view: page.id }
  if (page.url) return { kind: 'url', url: page.url }
  if (page.dashboardId) return { kind: 'dashboard', dashboardId: page.dashboardId }
  if (page.path) {
    if (page.path.startsWith('/url/')) {
      return { kind: 'url', url: decodeURIComponent(page.path.split('/url/').pop() || '') }
    }
    const dashboardMatch = /^\/dashboards?\/([0-9a-f-]{36})/i.exec(page.path)
    if (dashboardMatch) return { kind: 'dashboard', dashboardId: dashboardMatch[1] }
    return { kind: 'unknown', path: page.path }
  }
  return { kind: 'unknown', path: '/error' }
}

/** 图标：服务器配置的 material 图标名（或 mdi:xxx）优先，其次是页面默认图标。 */
export function iconForLayout(page: PageLayout): string {
  if (page.icon) return page.icon.replace(/^mdi:/, '')
  if (page.id) return PAGE_ICONS[page.id]
  return 'link'
}

export function titleForLayout(page: PageLayout): string {
  if (page.label) return page.label
  if (page.id) return PAGE_TITLES[page.id]
  return '-'
}

function keyForTarget(target: NavTarget, index: number): string {
  switch (target.kind) {
    case 'view':
      return target.view
    case 'dashboard':
      return `dashboard:${target.dashboardId}`
    case 'url':
      return `url:${index}`
    default:
      return `unknown:${index}`
  }
}

export interface NavigationState {
  bottomBar: NavItem[]
  more: NavItem[]
}

/**
 * 生成底部导航与更多菜单：手机宽度下最多 3 个页面 + 「更多」；
 * 页面总数少于 4 个时，最后一项改为「个人资料」。
 */
export function buildNavigation(
  layouts: PageLayout[] | null,
  authority: Authority,
  permissions: AllowedPermissionsInfo | null | undefined,
  maxBottomItems = 3
): NavigationState {
  const pages = (layouts ?? defaultPageLayouts(authority)).filter((p) => isPageVisible(p, authority, permissions))
  const all: NavItem[] = pages.map((page, index) => {
    const target = navTargetForLayout(page)
    return {
      key: keyForTarget(target, index),
      title: titleForLayout(page),
      icon: iconForLayout(page),
      target,
      showNotificationBadge: page.id === 'notifications'
    }
  })
  const last: NavItem =
    all.length < 4
      ? { key: 'profile', title: '个人资料', icon: 'person', target: { kind: 'view', view: 'profile' } }
      : { key: 'more', title: '更多', icon: 'menu', target: { kind: 'view', view: 'more' } }
  const bottomBar = [...all.slice(0, maxBottomItems), last]
  const more = all.slice(maxBottomItems)
  return { bottomBar, more }
}

import type { ReactNode } from 'react'
import AlarmsView from './AlarmsView'
import DashboardsView from './DashboardsView'
import DeviceListView from './DeviceListView'
import DevicesView from './DevicesView'
import EntityListView from './EntityListView'
import HomeView from './HomeView'
import MoreView from './MoreView'
import NotificationsView from './NotificationsView'

export interface ViewParams {
  deviceType?: string
  active?: boolean
  unreadCount?: number
}

/** 视图注册表：主页面底部导航与 section 容器页共用。 */
export function renderView(view: string, params: ViewParams = {}): ReactNode {
  switch (view) {
    case 'home':
      return <HomeView />
    case 'alarms':
      return <AlarmsView />
    case 'devices':
      return <DevicesView />
    case 'device_list':
      return <DeviceListView deviceType={params.deviceType} active={params.active} />
    case 'customers':
      return <EntityListView kind='customers' />
    case 'assets':
      return <EntityListView kind='assets' />
    case 'tenants':
      return <EntityListView kind='tenants' />
    case 'audit_logs':
      return <EntityListView kind='auditLogs' />
    case 'notifications':
      return <NotificationsView />
    case 'dashboards':
      return <DashboardsView />
    case 'more':
      return <MoreView unreadCount={params.unreadCount} />
    default:
      return null
  }
}

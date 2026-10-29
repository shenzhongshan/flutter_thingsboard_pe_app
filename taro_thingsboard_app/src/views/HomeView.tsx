import { Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { getDashboardInfo } from '../api/entities'
import Icon from '../components/Icon'
import { hasReadGenericOrSharedGroupsPermission } from '../core/permissions'
import { authStore } from '../store/auth'
import { openDashboard } from '../utils/router'
import DashboardsView from './DashboardsView'
import EntityListView from './EntityListView'

/**
 * 首页，对应 Flutter 版 lib/modules/home/home_page.dart：
 * - 配置了首页仪表板：展示首页仪表板入口（小程序 web-view 需整页打开）；
 * - 系统管理员：租户列表；
 * - 其他用户：仪表板列表。
 */
export default function HomeView() {
  const homeDashboard = authStore.use((s) => s.homeDashboard)
  const authority = authStore.use((s) => s.authUser?.authority)
  const permissions = authStore.use((s) => s.permissions)
  const [title, setTitle] = useState('')

  const dashboardId = homeDashboard?.dashboardId?.id
  useEffect(() => {
    if (!dashboardId) return
    getDashboardInfo(dashboardId)
      .then((d) => setTitle(d.title))
      .catch(() => setTitle('首页仪表板'))
  }, [dashboardId])

  const homeCard = dashboardId ? (
    <View
      className='home-card'
      hoverClass='hover'
      onClick={() => openDashboard(dashboardId, title, { hideToolbar: homeDashboard?.hideDashboardToolbar })}
    >
      <Icon name='dashboard' size={64} color='#ffffff' />
      <View className='home-card-body'>
        <Text className='home-card-title'>{title || '首页仪表板'}</Text>
        <Text className='home-card-sub'>点击打开首页仪表板</Text>
      </View>
      <Icon name='chevron_right' size={44} color='#ffffff' />
    </View>
  ) : undefined

  if (authority === 'SYS_ADMIN' && !dashboardId) {
    return <EntityListView kind='tenants' />
  }
  if (authority !== 'SYS_ADMIN' && permissions && !hasReadGenericOrSharedGroupsPermission(permissions, 'DASHBOARD', 'DASHBOARD')) {
    return (
      <View className='view'>
        {homeCard}
        <View className='empty'>
          <Icon name='lock' size={72} color='#c0c0c0' />
          <Text className='empty-text'>没有查看仪表板的权限</Text>
        </View>
      </View>
    )
  }
  return <DashboardsView header={homeCard} />
}

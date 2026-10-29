import { Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import { deleteNotification, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from '../api/notifications'
import type { Notification } from '../api/types'
import { Segmented } from '../components/Cells'
import Icon from '../components/Icon'
import PagedList from '../components/PagedList'
import { usePaged } from '../components/usePaged'
import { SEVERITY_COLORS } from '../core/alarm'
import { timeAgo } from '../utils/format'
import { Routes, go, openDashboard, openUrl } from '../utils/router'

type ReadFilter = 'unread' | 'all'

const TYPE_ICONS: Record<string, string> = {
  ALARM: 'notifications',
  ALARM_ASSIGNMENT: 'person',
  ALARM_COMMENT: 'edit',
  DEVICE_ACTIVITY: 'devices_other',
  ENTITY_ACTION: 'track_changes',
  RULE_ENGINE_COMPONENT_LIFECYCLE_EVENT: 'warning',
  ENTITIES_LIMIT: 'warning',
  API_USAGE_LIMIT: 'warning',
  GENERAL: 'info'
}

/** 点击通知后的跳转逻辑，对应 Flutter 版 NotificationService.handleNotification。 */
function handleAction(n: Notification) {
  const info = n.info || {}
  const button = info.actionButtonConfig
  if (button?.enabled) {
    if (button.linkType === 'DASHBOARD' && button.dashboardId) return openDashboard(button.dashboardId)
    if (button.link) return openUrl(button.link)
  }
  if (info.alarmId) return go(Routes.alarmDetail, { id: info.alarmId })
  if (info.dashboardId?.id) return openDashboard(info.dashboardId.id)
  return undefined
}

/** 通知中心，对应 Flutter 版 lib/modules/notification/notification_page.dart。 */
export default function NotificationsView() {
  const [filter, setFilter] = useState<ReadFilter>('unread')
  const paged = usePaged<Notification>((page) => getNotifications(page, filter === 'unread'), [filter])

  const onTap = async (n: Notification) => {
    if (n.status !== 'READ') {
      await markNotificationAsRead(n.id.id).catch(() => undefined)
      paged.setItems((items) =>
        filter === 'unread' ? items.filter((i) => i.id.id !== n.id.id) : items.map((i) => (i.id.id === n.id.id ? { ...i, status: 'READ' } : i))
      )
    }
    handleAction(n)
  }

  const onLongPress = async (n: Notification) => {
    const actions = n.status !== 'READ' ? ['标记为已读', '删除'] : ['删除']
    try {
      const { tapIndex } = await Taro.showActionSheet({ itemList: actions })
      const action = actions[tapIndex]
      if (action === '删除') {
        await deleteNotification(n.id.id)
        paged.setItems((items) => items.filter((i) => i.id.id !== n.id.id))
      } else {
        await markNotificationAsRead(n.id.id)
        paged.reload()
      }
    } catch (_) {
      // 取消
    }
  }

  const markAll = async () => {
    await markAllNotificationsAsRead()
    Taro.showToast({ title: '已全部标记为已读', icon: 'none' })
    paged.reload()
  }

  return (
    <View className='view'>
      <View className='row-between toolbar'>
        <Segmented<ReadFilter>
          value={filter}
          onChange={setFilter}
          options={[
            { value: 'unread', label: '未读' },
            { value: 'all', label: '全部' }
          ]}
        />
        <View className='toolbar-btn' onClick={markAll}>
          <Icon name='done_all' size={44} color='#305680' />
        </View>
      </View>
      <PagedList
        state={paged}
        keyOf={(n) => n.id.id}
        emptyText={filter === 'unread' ? '没有未读通知' : '暂无通知'}
        renderItem={(n) => {
          const iconCfg = n.additionalConfig?.icon
          const color =
            (n.info?.alarmSeverity && SEVERITY_COLORS[n.info.alarmSeverity]) || (iconCfg?.enabled && iconCfg.color) || '#305680'
          return (
            <View
              className={`list-card notification ${n.status === 'READ' ? 'read' : ''}`}
              hoverClass='hover'
              onClick={() => onTap(n)}
              onLongPress={() => onLongPress(n)}
            >
              <View className='notification-icon' style={{ backgroundColor: color }}>
                <Icon name={TYPE_ICONS[n.type] || 'notifications'} size={40} color='#ffffff' />
              </View>
              <View className='list-card-body'>
                <View className='row-between'>
                  <Text className='list-card-title'>{n.subject}</Text>
                  {n.status !== 'READ' && <View className='unread-dot' />}
                </View>
                <Text className='notification-text'>{n.text}</Text>
                <Text className='muted'>{timeAgo(n.createdTime)}</Text>
              </View>
            </View>
          )
        }}
      />
    </View>
  )
}

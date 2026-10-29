import { Text, View } from '@tarojs/components'
import Taro, { useDidHide, useDidShow } from '@tarojs/taro'
import { useEffect, useRef, useState } from 'react'
import { getUnreadNotificationsCount } from '../../api/notifications'
import Icon from '../../components/Icon'
import type { NavItem } from '../../core/navigation'
import { authStore } from '../../store/auth'
import { appEvents } from '../../utils/events'
import { openNavTarget, relaunchToLogin } from '../../utils/router'
import ProfileView from '../../views/ProfileView'
import { renderView } from '../../views/registry'
import './index.scss'

const POLL_INTERVAL = 30000

/** 未读通知数量：轮询 + 通知变更事件，对应 Flutter 版 notification badge。 */
function useUnreadCount(enabled: boolean) {
  const [count, setCount] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval>>()
  const refresh = () => {
    getUnreadNotificationsCount()
      .then((n) => setCount(Number(n) || 0))
      .catch(() => undefined)
  }
  const start = () => {
    clearInterval(timer.current)
    if (!enabled) return
    refresh()
    timer.current = setInterval(refresh, POLL_INTERVAL)
  }
  useEffect(() => {
    start()
    const off = appEvents.on('notificationsChanged', refresh)
    return () => {
      off()
      clearInterval(timer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])
  useDidShow(start)
  useDidHide(() => clearInterval(timer.current))
  return count
}

/** 主界面：动态底部导航，对应 Flutter 版 lib/modules/main/navigation_page.dart。 */
export default function MainPage() {
  const status = authStore.use((s) => s.status)
  const bottomBar = authStore.use((s) => s.navigation.bottomBar)
  const more = authStore.use((s) => s.navigation.more)
  const [activeKey, setActiveKey] = useState<string>('')
  const [visited, setVisited] = useState<string[]>([])
  const hasNotifications = [...bottomBar, ...more].some((i) => i.showNotificationBadge)
  const unread = useUnreadCount(status === 'authenticated' && hasNotifications)

  useEffect(() => {
    if (status === 'unauthenticated') relaunchToLogin()
  }, [status])

  // 布局加载完成后默认选中第一个页面
  useEffect(() => {
    const first = bottomBar.find((i) => i.target.kind === 'view')
    if (first && !bottomBar.some((i) => i.key === activeKey)) {
      setActiveKey(first.key)
      setVisited([first.key])
    }
  }, [bottomBar, activeKey])

  const active = bottomBar.find((i) => i.key === activeKey)
  useEffect(() => {
    if (active) Taro.setNavigationBarTitle({ title: active.title })
  }, [active])

  const onTab = (item: NavItem) => {
    if (item.target.kind !== 'view' || item.target.view === 'live_location_tracking') {
      // 仪表板 / 外部链接需要整页 web-view 打开
      openNavTarget(item.target, item.title)
      return
    }
    setActiveKey(item.key)
    if (!visited.includes(item.key)) setVisited([...visited, item.key])
  }

  if (status !== 'authenticated') {
    return (
      <View className='splash'>
        <Text className='splash-logo'>ThingsBoard</Text>
        <Text className='splash-sub'>正在加载…</Text>
      </View>
    )
  }

  const moreBadge = more.some((i) => i.showNotificationBadge) ? unread : 0

  return (
    <View className='page'>
      <View className='main-content'>
        {bottomBar
          .filter((item) => visited.includes(item.key) && item.target.kind === 'view')
          .map((item) => (
            <View key={item.key} className='tab-pane' style={{ display: item.key === activeKey ? 'flex' : 'none' }}>
              {item.target.kind === 'view' && item.target.view === 'profile' ? (
                <ProfileView />
              ) : (
                item.target.kind === 'view' && renderView(item.target.view, { unreadCount: unread })
              )}
            </View>
          ))}
      </View>
      <View className='bottom-bar'>
        {bottomBar.map((item) => {
          const selected = item.key === activeKey
          const badge = item.showNotificationBadge ? unread : item.key === 'more' ? moreBadge : 0
          return (
            <View key={item.key} className='bottom-item' onClick={() => onTab(item)}>
              <View className='bottom-icon'>
                <Icon name={item.icon} size={48} color={selected ? '#305680' : '#8a8a8a'} />
                {badge > 0 && <Text className='bottom-badge'>{badge > 99 ? '99+' : badge}</Text>}
              </View>
              <Text className={`bottom-label ${selected ? 'selected' : ''}`}>{item.title}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

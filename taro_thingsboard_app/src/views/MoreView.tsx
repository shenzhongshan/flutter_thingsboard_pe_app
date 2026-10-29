import { ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import Avatar from '../components/Avatar'
import { MenuItem, Section } from '../components/Cells'
import Icon from '../components/Icon'
import { authStore, logout } from '../store/auth'
import { fullName } from '../utils/format'
import { Routes, go, openNavTarget, relaunchToLogin } from '../utils/router'
import { AUTHORITY_LABELS } from './labels'

export async function confirmLogout() {
  const { confirm } = await Taro.showModal({ title: '退出登录', content: '确定要退出当前账号吗？' })
  if (!confirm) return
  Taro.showLoading({ title: '正在退出' })
  await logout()
  Taro.hideLoading()
  relaunchToLogin()
}

/** 「更多」菜单，对应 Flutter 版 lib/modules/more/more_page.dart。 */
export default function MoreView({ unreadCount }: { unreadCount?: number }) {
  const user = authStore.use((s) => s.user)
  const authority = authStore.use((s) => s.authUser?.authority)
  const more = authStore.use((s) => s.navigation.more)
  const name = fullName(user)

  return (
    <ScrollView className='view' scrollY>
      <View className='profile-header' hoverClass='hover' onClick={() => go(Routes.profile)}>
        <Avatar text={name} size={112} />
        <View className='list-card-body'>
          <Text className='profile-header-name'>{name}</Text>
          <Text className='muted'>{AUTHORITY_LABELS[authority || ''] || authority}</Text>
          {user?.email && name !== user.email && <Text className='muted'>{user.email}</Text>}
        </View>
        <Icon name='chevron_right' size={44} color='#c0c0c0' />
      </View>

      {more.length > 0 && (
        <Section>
          {more.map((item) => (
            <MenuItem
              key={item.key}
              icon={item.icon}
              title={item.title}
              badge={item.showNotificationBadge ? unreadCount : undefined}
              onClick={() => openNavTarget(item.target, item.title)}
            />
          ))}
        </Section>
      )}

      <Section>
        <MenuItem icon='person' title='个人资料' onClick={() => go(Routes.profile)} />
        <MenuItem icon='lock' title='修改密码' onClick={() => go(Routes.changePassword)} />
        <MenuItem icon='logout' title='退出登录' danger onClick={confirmLogout} />
      </Section>
    </ScrollView>
  )
}

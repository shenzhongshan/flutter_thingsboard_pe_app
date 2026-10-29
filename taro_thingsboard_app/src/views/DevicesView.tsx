import { Image, Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { countDevices, getDeviceProfileInfos } from '../api/entities'
import type { DeviceProfileInfo } from '../api/types'
import Icon from '../components/Icon'
import PagedList from '../components/PagedList'
import { usePaged } from '../components/usePaged'
import { Routes, go } from '../utils/router'

function useDeviceCounts(deviceType: string | undefined, refreshKey: number) {
  const [counts, setCounts] = useState<{ active?: number; inactive?: number }>({})
  useEffect(() => {
    let alive = true
    setCounts({})
    Promise.all([countDevices({ deviceType, active: true }), countDevices({ deviceType, active: false })])
      .then(([active, inactive]) => alive && setCounts({ active, inactive }))
      .catch(() => alive && setCounts({}))
    return () => {
      alive = false
    }
  }, [deviceType, refreshKey])
  return counts
}

function CountBox({ label, value, color, onClick }: { label: string; value?: number; color: string; onClick: () => void }) {
  return (
    <View className='count-box' hoverClass='hover' onClick={onClick}>
      <View className='dot' style={{ backgroundColor: color }} />
      <Text className='count-label'>{label}</Text>
      <Text className='count-value'>{value === undefined ? '…' : value}</Text>
    </View>
  )
}

/** 「全部设备」卡片：在线/离线数量，对应 Flutter 版 AllDevicesCard。 */
function AllDevicesCard({ refreshKey }: { refreshKey: number }) {
  const counts = useDeviceCounts(undefined, refreshKey)
  const open = (active?: boolean) => go(Routes.section, { view: 'device_list', title: '全部设备', active })
  return (
    <View className='all-devices-card'>
      <View className='row-between' onClick={() => open()}>
        <Text className='all-devices-title'>全部设备</Text>
        <Icon name='chevron_right' size={40} color='#c0c0c0' />
      </View>
      <View className='row count-row'>
        <CountBox label='在线' value={counts.active} color='#008A00' onClick={() => open(true)} />
        <CountBox label='离线' value={counts.inactive} color='#AFAFAF' onClick={() => open(false)} />
      </View>
    </View>
  )
}

function ProfileCard({ profile, refreshKey }: { profile: DeviceProfileInfo; refreshKey: number }) {
  const counts = useDeviceCounts(profile.name, refreshKey)
  return (
    <View
      className='profile-card'
      hoverClass='hover'
      onClick={() => go(Routes.section, { view: 'device_list', title: profile.name, deviceType: profile.name })}
    >
      {profile.image ? (
        <Image className='profile-image' src={profile.image} mode='aspectFit' />
      ) : (
        <View className='profile-image thumb-placeholder'>
          <Icon name='devices_other' size={72} color='#305680' />
        </View>
      )}
      <Text className='profile-name'>{profile.name}</Text>
      <View className='row profile-counts'>
        <Text className='count-chip active'>{counts.active ?? '…'}</Text>
        <Text className='muted'>/</Text>
        <Text className='count-chip'>{counts.inactive ?? '…'}</Text>
      </View>
    </View>
  )
}

/** 设备首页：设备配置网格 + 全部设备统计，对应 Flutter 版 devices_main_page / device_profiles_grid。 */
export default function DevicesView() {
  const [refreshKey, setRefreshKey] = useState(0)
  const paged = usePaged<DeviceProfileInfo>((page) => getDeviceProfileInfos({ page, pageSize: 40 }), [])
  const state = {
    ...paged,
    refresh: () => {
      setRefreshKey((k) => k + 1)
      return paged.refresh()
    }
  }
  // 网格：每两项一行
  const rows: DeviceProfileInfo[][] = []
  for (let i = 0; i < paged.items.length; i += 2) rows.push(paged.items.slice(i, i + 2))
  const rowState = { ...state, items: rows } as any

  return (
    <View className='view'>
      <PagedList<DeviceProfileInfo[]>
        state={rowState}
        header={<AllDevicesCard refreshKey={refreshKey} />}
        keyOf={(row) => row.map((p) => p.id.id).join('|')}
        emptyText='暂无设备配置'
        renderItem={(row) => (
          <View className='grid-row'>
            {row.map((p) => (
              <ProfileCard key={p.id.id} profile={p} refreshKey={refreshKey} />
            ))}
            {row.length === 1 && <View className='profile-card placeholder' />}
          </View>
        )}
      />
    </View>
  )
}

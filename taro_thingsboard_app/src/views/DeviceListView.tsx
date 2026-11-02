import { Text, View } from '@tarojs/components'
import { useState } from 'react'
import { entityField, findDevices, isDeviceActive } from '../api/entities'
import type { EntityData } from '../api/types'
import { Segmented } from '../components/Cells'
import Icon from '../components/Icon'
import PagedList from '../components/PagedList'
import SearchBar from '../components/SearchBar'
import { usePaged } from '../components/usePaged'
import { formatDate } from '../utils/format'
import { Routes, go } from '../utils/router'

type ActiveFilter = 'all' | 'active' | 'inactive'

function toFilter(active?: boolean): ActiveFilter {
  if (active === true) return 'active'
  if (active === false) return 'inactive'
  return 'all'
}

/** 设备列表（可按设备类型、在线状态筛选），对应 Flutter 版 devices_list_page。 */
export default function DeviceListView({ deviceType, active }: { deviceType?: string; active?: boolean }) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<ActiveFilter>(toFilter(active))
  const paged = usePaged<EntityData>(
    (page) =>
      findDevices({
        page,
        textSearch: search,
        deviceType,
        active: filter === 'all' ? undefined : filter === 'active'
      }),
    [search, filter, deviceType]
  )

  return (
    <View className='view'>
      <SearchBar placeholder='搜索设备' onSearch={setSearch} />
      <Segmented<ActiveFilter>
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: '全部' },
          { value: 'active', label: '在线' },
          { value: 'inactive', label: '离线' }
        ]}
      />
      <PagedList
        state={paged}
        keyOf={(d) => d.entityId.id}
        emptyText='暂无设备'
        renderItem={(d) => {
          const isActive = isDeviceActive(d)
          const name = entityField(d, 'name') || '-'
          const label = entityField(d, 'label')
          return (
            <View className='list-card' hoverClass='hover' onClick={() => go(Routes.deviceDetail, { id: d.entityId.id })}>
              <View className='stripe' style={{ backgroundColor: isActive ? '#008A00' : '#AFAFAF' }} />
              <View className='list-card-body'>
                <Text className='list-card-title'>{label || name}</Text>
                <Text className='list-card-sub'>
                  {entityField(d, 'type')} · {formatDate(Number(entityField(d, 'createdTime')))}
                </Text>
              </View>
              <Text className={`status-pill ${isActive ? 'on' : 'off'}`}>{isActive ? '在线' : '离线'}</Text>
              <Icon name='chevron_right' size={40} color='#c0c0c0' />
            </View>
          )
        }}
      />
    </View>
  )
}

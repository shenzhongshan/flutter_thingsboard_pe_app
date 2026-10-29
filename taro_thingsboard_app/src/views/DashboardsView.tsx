import { Image, Text, View } from '@tarojs/components'
import { useState } from 'react'
import { getUserDashboards } from '../api/entities'
import type { DashboardInfo } from '../api/types'
import Icon from '../components/Icon'
import PagedList from '../components/PagedList'
import SearchBar from '../components/SearchBar'
import { usePaged } from '../components/usePaged'
import { openDashboard } from '../utils/router'
import type { ReactNode } from 'react'

/** 仪表板列表，对应 Flutter 版 dashboards_page / dashboards_grid。 */
export default function DashboardsView({ header }: { header?: ReactNode }) {
  const [search, setSearch] = useState('')
  const paged = usePaged<DashboardInfo>((page) => getUserDashboards({ page, textSearch: search }), [search])
  return (
    <View className='view'>
      <SearchBar placeholder='搜索仪表板' onSearch={setSearch} />
      <PagedList
        state={paged}
        header={header}
        keyOf={(d) => d.id.id}
        emptyText='暂无仪表板'
        renderItem={(d) => (
          <View className='list-card' hoverClass='hover' onClick={() => openDashboard(d.id.id, d.title)}>
            {d.image ? (
              <Image className='thumb' src={d.image} mode='aspectFill' />
            ) : (
              <View className='thumb thumb-placeholder'>
                <Icon name='dashboard' size={48} color='#305680' />
              </View>
            )}
            <View className='list-card-body'>
              <Text className='list-card-title'>{d.title}</Text>
            </View>
            <Icon name='chevron_right' size={40} color='#c0c0c0' />
          </View>
        )}
      />
    </View>
  )
}

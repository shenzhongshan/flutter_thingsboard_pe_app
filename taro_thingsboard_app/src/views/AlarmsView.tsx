import { Text, View } from '@tarojs/components'
import { useEffect, useState } from 'react'
import { getAlarms } from '../api/alarms'
import type { AlarmInfo } from '../api/types'
import Icon from '../components/Icon'
import PagedList from '../components/PagedList'
import SearchBar from '../components/SearchBar'
import { usePaged } from '../components/usePaged'
import { countActiveFilters } from '../core/alarm'
import { alarmFiltersStore } from '../store/alarmFilters'
import { authStore } from '../store/auth'
import { appEvents } from '../utils/events'
import { Routes, go } from '../utils/router'
import AlarmCard from './AlarmCard'

/** 告警列表，对应 Flutter 版 lib/modules/alarm/alarms_page。 */
export default function AlarmsView() {
  const [search, setSearch] = useState('')
  const filters = alarmFiltersStore.use((s) => s.filters)
  const userId = authStore.use((s) => s.authUser?.userId)
  const filterCount = countActiveFilters(filters)

  const paged = usePaged<AlarmInfo>(
    (page) =>
      getAlarms({
        page,
        textSearch: search,
        statusList: filters.statusList,
        severityList: filters.severityList,
        typeList: filters.typeList,
        assigneeId: filters.assignedToMe ? userId : filters.assignee?.id
      }),
    [search, filters, userId]
  )

  // 详情页处理（确认/清除/指派）后刷新列表
  useEffect(() => appEvents.on('alarmChanged', () => paged.reload()), [paged.reload])

  return (
    <View className='view'>
      <SearchBar
        placeholder='搜索告警'
        onSearch={setSearch}
        extra={
          <View className='toolbar-btn' onClick={() => go(Routes.alarmFilter)}>
            <Icon name='filter_list' size={48} color='#305680' />
            {filterCount > 0 && <Text className='toolbar-dot'>{filterCount}</Text>}
          </View>
        }
      />
      <PagedList
        state={paged}
        keyOf={(a) => a.id.id}
        renderItem={(a) => <AlarmCard alarm={a} />}
        emptyText='没有符合条件的告警'
      />
    </View>
  )
}

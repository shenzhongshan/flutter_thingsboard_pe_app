import { Button, Picker, ScrollView, Text, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useEffect, useState } from 'react'
import { findUsers, getAlarmTypes } from '../../api/alarms'
import type { AlarmSearchStatus, AlarmSeverity, UserInfoShort } from '../../api/types'
import { Chip, Section } from '../../components/Cells'
import {
  DEFAULT_ALARM_FILTERS,
  SEARCH_STATUSES,
  SEARCH_STATUS_LABELS,
  SEVERITIES,
  SEVERITY_COLORS,
  SEVERITY_LABELS,
  type AlarmFilters
} from '../../core/alarm'
import { alarmFiltersStore, setAlarmFilters } from '../../store/alarmFilters'
import { fullName } from '../../utils/format'
import './index.scss'

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value]
}

/** 告警筛选：状态、严重程度、类型、指派人，对应 Flutter 版 alarm filters。 */
export default function AlarmFilterPage() {
  const [filters, setFilters] = useState<AlarmFilters>(alarmFiltersStore.get().filters)
  const [types, setTypes] = useState<string[]>([])
  const [users, setUsers] = useState<UserInfoShort[]>([])

  useEffect(() => {
    getAlarmTypes(0)
      .then((res) => setTypes(res.data.map((t) => t.type)))
      .catch(() => undefined)
    findUsers(0)
      .then((res) => setUsers(res.data))
      .catch(() => undefined)
  }, [])

  const assigneeOptions = ['不限', '仅指派给我', ...users.map((u) => fullName(u) || u.email)]
  const pickAssignee = (index: number) => {
    if (index === 0) setFilters((f) => ({ ...f, assignee: null, assignedToMe: false }))
    else if (index === 1) setFilters((f) => ({ ...f, assignee: null, assignedToMe: true }))
    else {
      const u = users[index - 2]
      setFilters((f) => ({ ...f, assignedToMe: false, assignee: { id: u.id.id, label: fullName(u) || u.email } }))
    }
  }

  const assigneeText = filters.assignedToMe ? '仅指派给我' : filters.assignee?.label || '不限'

  return (
    <View className='page'>
      <ScrollView className='page-scroll' scrollY>
        <Section title='告警状态'>
          <View className='chips'>
            {SEARCH_STATUSES.map((s) => (
              <Chip
                key={s}
                label={SEARCH_STATUS_LABELS[s]}
                active={filters.statusList.includes(s)}
                onClick={() => setFilters((f) => ({ ...f, statusList: toggle<AlarmSearchStatus>(f.statusList, s) }))}
              />
            ))}
          </View>
        </Section>
        <Section title='严重程度'>
          <View className='chips'>
            {SEVERITIES.map((s) => (
              <Chip
                key={s}
                label={SEVERITY_LABELS[s]}
                color={SEVERITY_COLORS[s]}
                active={filters.severityList.includes(s)}
                onClick={() => setFilters((f) => ({ ...f, severityList: toggle<AlarmSeverity>(f.severityList, s) }))}
              />
            ))}
          </View>
        </Section>
        <Section title='告警类型'>
          <View className='chips'>
            {types.length === 0 && <Text className='muted'>暂无告警类型</Text>}
            {types.map((t) => (
              <Chip
                key={t}
                label={t}
                active={filters.typeList.includes(t)}
                onClick={() => setFilters((f) => ({ ...f, typeList: toggle(f.typeList, t) }))}
              />
            ))}
          </View>
        </Section>
        <Section title='指派给'>
          <Picker mode='selector' range={assigneeOptions} onChange={(e) => pickAssignee(Number(e.detail.value))}>
            <View className='assignee-row'>
              <Text>{assigneeText}</Text>
              <Text className='link'>选择</Text>
            </View>
          </Picker>
        </Section>
      </ScrollView>
      <View className='filter-actions'>
        <Button className='btn btn-outline' onClick={() => setFilters(DEFAULT_ALARM_FILTERS)}>
          重置
        </Button>
        <Button
          className='btn'
          onClick={() => {
            setAlarmFilters(filters)
            Taro.navigateBack()
          }}
        >
          应用
        </Button>
      </View>
    </View>
  )
}

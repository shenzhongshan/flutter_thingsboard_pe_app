import { Text, View } from '@tarojs/components'
import type { AlarmInfo } from '../api/types'
import { SEVERITY_COLORS, SEVERITY_LABELS, alarmStatusText } from '../core/alarm'
import { fullName, timeAgo } from '../utils/format'
import { Routes, go } from '../utils/router'
import './views.scss'

/** 告警卡片，对应 Flutter 版 alarm_card。 */
export default function AlarmCard({ alarm }: { alarm: AlarmInfo }) {
  const color = SEVERITY_COLORS[alarm.severity] || '#999'
  const assignee = alarm.assignee ? fullName(alarm.assignee) : ''
  return (
    <View className='list-card' hoverClass='hover' onClick={() => go(Routes.alarmDetail, { id: alarm.id.id })}>
      <View className='stripe' style={{ backgroundColor: color }} />
      <View className='list-card-body'>
        <View className='row-between'>
          <Text className='list-card-title'>{alarm.type}</Text>
          <Text className='muted'>{timeAgo(alarm.createdTime)}</Text>
        </View>
        <Text className='list-card-sub'>{alarm.originatorLabel || alarm.originatorName || '-'}</Text>
        <View className='row-between'>
          <View className='row'>
            <Text className='tag' style={{ backgroundColor: color }}>
              {SEVERITY_LABELS[alarm.severity] || alarm.severity}
            </Text>
            <Text className='muted status-text'>{alarmStatusText(alarm)}</Text>
          </View>
          {assignee && <Text className='muted ellipsis assignee'>{assignee}</Text>}
        </View>
      </View>
    </View>
  )
}

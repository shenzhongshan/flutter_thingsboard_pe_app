import type { AlarmInfo, AlarmSearchStatus, AlarmSeverity } from '../api/types'

/** 告警展示相关的常量与工具函数，对应 Flutter 版 alarm 模块的翻译与配色。 */

export const SEVERITY_LABELS: Record<AlarmSeverity, string> = {
  CRITICAL: '危险',
  MAJOR: '重要',
  MINOR: '次要',
  WARNING: '警告',
  INDETERMINATE: '不确定'
}

export const SEVERITY_COLORS: Record<AlarmSeverity, string> = {
  CRITICAL: '#D12730',
  MAJOR: '#FEAC0C',
  MINOR: '#F2DA05',
  WARNING: '#F66716',
  INDETERMINATE: '#00000061'
}

export const SEVERITIES: AlarmSeverity[] = ['CRITICAL', 'MAJOR', 'MINOR', 'WARNING', 'INDETERMINATE']

export const SEARCH_STATUS_LABELS: Record<AlarmSearchStatus, string> = {
  ANY: '全部',
  ACTIVE: '激活',
  CLEARED: '已清除',
  ACK: '已确认',
  UNACK: '未确认'
}

export const SEARCH_STATUSES: AlarmSearchStatus[] = ['ACTIVE', 'CLEARED', 'ACK', 'UNACK']

export function alarmStatusText(alarm: Pick<AlarmInfo, 'acknowledged' | 'cleared'>): string {
  const state = alarm.cleared ? '已清除' : '激活'
  const ack = alarm.acknowledged ? '已确认' : '未确认'
  return `${state} · ${ack}`
}

export interface AlarmFilters {
  statusList: AlarmSearchStatus[]
  severityList: AlarmSeverity[]
  typeList: string[]
  assignee?: { id: string; label: string } | null
  /** 「仅指派给我」 */
  assignedToMe?: boolean
}

/** 默认只显示激活的告警，与 Flutter 版默认筛选一致。 */
export const DEFAULT_ALARM_FILTERS: AlarmFilters = {
  statusList: ['ACTIVE'],
  severityList: [],
  typeList: [],
  assignee: null,
  assignedToMe: false
}

export function countActiveFilters(f: AlarmFilters): number {
  let n = 0
  if (f.statusList.length && !(f.statusList.length === 1 && f.statusList[0] === 'ACTIVE')) n++
  if (f.severityList.length) n++
  if (f.typeList.length) n++
  if (f.assignee || f.assignedToMe) n++
  return n
}

/** 告警活动（评论）中系统消息的展示文案。 */
export function systemCommentText(comment: { text: string; subtype?: string }): string {
  return comment.text
}

import { DEFAULT_PAGE_SIZE } from '../config'
import { http } from './http'
import type { AlarmComment, AlarmInfo, AlarmSearchStatus, AlarmSeverity, PageData, UserInfoShort } from './types'

/** 告警接口，对应 Flutter 版 lib/modules/alarm/data/**。 */

export interface AlarmQuery {
  page: number
  pageSize?: number
  textSearch?: string
  statusList?: AlarmSearchStatus[]
  severityList?: AlarmSeverity[]
  typeList?: string[]
  assigneeId?: string
}

export function getAlarms(q: AlarmQuery) {
  return http.get<PageData<AlarmInfo>>('/api/v2/alarms', {
    pageSize: q.pageSize ?? DEFAULT_PAGE_SIZE,
    page: q.page,
    textSearch: q.textSearch,
    sortProperty: 'createdTime',
    sortOrder: 'DESC',
    statusList: q.statusList,
    severityList: q.severityList,
    typeList: q.typeList,
    assigneeId: q.assigneeId
  })
}

export function getAlarmInfo(id: string) {
  return http.get<AlarmInfo>(`/api/alarm/info/${id}`)
}

export function ackAlarm(id: string) {
  return http.post<AlarmInfo>(`/api/alarm/${id}/ack`)
}

export function clearAlarm(id: string) {
  return http.post<AlarmInfo>(`/api/alarm/${id}/clear`)
}

export function assignAlarm(id: string, userId: string) {
  return http.post<AlarmInfo>(`/api/alarm/${id}/assign/${userId}`)
}

export function unassignAlarm(id: string) {
  return http.delete<AlarmInfo>(`/api/alarm/${id}/assign`)
}

export function getAlarmTypes(page: number, textSearch?: string) {
  return http.get<PageData<{ type: string }>>('/api/alarm/types', {
    pageSize: 50,
    page,
    textSearch,
    sortOrder: 'ASC'
  })
}

/** 可被指派的用户列表（/api/users/assign/{alarmId}）。 */
export function getUsersForAssign(alarmId: string, page: number, textSearch?: string) {
  return http.get<PageData<UserInfoShort>>(`/api/users/assign/${alarmId}`, {
    pageSize: DEFAULT_PAGE_SIZE,
    page,
    textSearch,
    sortProperty: 'email',
    sortOrder: 'ASC'
  })
}

/** 告警筛选「指派给」下拉使用的用户列表。 */
export function findUsers(page: number, textSearch?: string) {
  return http.get<PageData<UserInfoShort>>('/api/users/info', {
    pageSize: DEFAULT_PAGE_SIZE,
    page,
    textSearch,
    sortProperty: 'email',
    sortOrder: 'ASC'
  })
}

/* ---------- 告警活动（评论） ---------- */

export function getAlarmComments(alarmId: string, page: number) {
  return http.get<PageData<AlarmComment>>(`/api/alarm/${alarmId}/comment`, {
    pageSize: DEFAULT_PAGE_SIZE,
    page,
    sortProperty: 'createdTime',
    sortOrder: 'DESC'
  })
}

export function saveAlarmComment(alarmId: string, text: string, commentId?: string) {
  return http.post<AlarmComment>(`/api/alarm/${alarmId}/comment`, {
    ...(commentId ? { id: { entityType: 'ALARM_COMMENT', id: commentId } } : {}),
    alarmId: { entityType: 'ALARM', id: alarmId },
    comment: { text }
  })
}

export function deleteAlarmComment(alarmId: string, commentId: string) {
  return http.delete(`/api/alarm/${alarmId}/comment/${commentId}`)
}

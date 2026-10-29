import { DEFAULT_PAGE_SIZE } from '../config'
import { appEvents } from '../utils/events'
import { http } from './http'
import type { Notification, PageData } from './types'

/** 通知中心接口，对应 Flutter 版 lib/modules/notification/**。 */

const DELIVERY_METHOD = 'MOBILE_APP'

export function getNotifications(page: number, unreadOnly: boolean) {
  return http.get<PageData<Notification>>('/api/notifications', {
    pageSize: DEFAULT_PAGE_SIZE,
    page,
    sortProperty: 'createdTime',
    sortOrder: 'DESC',
    unreadOnly,
    deliveryMethod: DELIVERY_METHOD
  })
}

export function getUnreadNotificationsCount() {
  return http.get<number>('/api/notifications/unread/count', { deliveryMethod: DELIVERY_METHOD }, { silent: true })
}

export async function markNotificationAsRead(id: string) {
  await http.put(`/api/notification/${id}/read`)
  appEvents.emit('notificationsChanged', undefined)
}

export async function markAllNotificationsAsRead() {
  await http.put('/api/notifications/read', undefined, { query: { deliveryMethod: DELIVERY_METHOD } })
  appEvents.emit('notificationsChanged', undefined)
}

export async function deleteNotification(id: string) {
  await http.delete(`/api/notification/${id}`)
  appEvents.emit('notificationsChanged', undefined)
}

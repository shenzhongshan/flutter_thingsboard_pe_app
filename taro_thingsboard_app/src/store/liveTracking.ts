import Taro from '@tarojs/taro'
import { saveServerAttributes, saveTelemetry } from '../api/entities'
import type { EntityId } from '../api/types'
import { StorageKeys, getItem, setItem } from '../utils/storage'
import { createStore } from './createStore'

/**
 * 实时位置追踪，对应 Flutter 版 lib/utils/services/live_location_tracking。
 * Flutter 版由仪表板移动端动作下发追踪配置；小程序 web-view 无法与原生通信，
 * 因此改为由用户在本页选择目标设备，并按固定键名上报：
 * - 遥测：latitude / longitude / accuracy / altitude / speed
 * - 服务端属性：gpsActive / gpsTrackedBy
 */

export interface TrackingTarget {
  id: EntityId
  name: string
}

export interface LiveTrackingState {
  target: TrackingTarget | null
  active: boolean
  intervalSeconds: number
  lastFix: { latitude: number; longitude: number; accuracy: number; ts: number } | null
  sentCount: number
  error: string | null
}

const saved = getItem<{ target: TrackingTarget | null; intervalSeconds: number }>(StorageKeys.liveTracking)

export const liveTrackingStore = createStore<LiveTrackingState>({
  target: saved?.target ?? null,
  active: false,
  intervalSeconds: saved?.intervalSeconds ?? 10,
  lastFix: null,
  sentCount: 0,
  error: null
})

let lastSent = 0
let trackedBy = ''

function persist() {
  const { target, intervalSeconds } = liveTrackingStore.get()
  setItem(StorageKeys.liveTracking, { target, intervalSeconds })
}

export function setTrackingTarget(target: TrackingTarget | null) {
  liveTrackingStore.set({ target })
  persist()
}

export function setTrackingInterval(intervalSeconds: number) {
  liveTrackingStore.set({ intervalSeconds })
  persist()
}

const onLocation = (res: Taro.onLocationChange.CallbackResult) => {
  const { target, intervalSeconds, sentCount } = liveTrackingStore.get()
  const now = Date.now()
  liveTrackingStore.set({
    lastFix: { latitude: res.latitude, longitude: res.longitude, accuracy: res.accuracy, ts: now }
  })
  if (!target || now - lastSent < intervalSeconds * 1000) return
  lastSent = now
  saveTelemetry(target.id.entityType, target.id.id, now, {
    latitude: res.latitude,
    longitude: res.longitude,
    accuracy: res.accuracy,
    altitude: res.altitude,
    speed: res.speed
  })
    .then(() => liveTrackingStore.set({ sentCount: sentCount + 1, error: null }))
    .catch((e) => liveTrackingStore.set({ error: e?.message || '上报失败' }))
}

export async function startTracking(userLabel: string): Promise<void> {
  const { target, active } = liveTrackingStore.get()
  if (!target || active) return
  trackedBy = userLabel
  try {
    await Taro.startLocationUpdate()
  } catch (e: any) {
    liveTrackingStore.set({ error: '无法获取定位权限，请在设置中允许使用位置信息' })
    throw e
  }
  lastSent = 0
  Taro.onLocationChange(onLocation)
  liveTrackingStore.set({ active: true, sentCount: 0, error: null })
  saveServerAttributes(target.id.entityType, target.id.id, { gpsActive: true, gpsTrackedBy: trackedBy }).catch(
    () => undefined
  )
}

export async function stopTracking(): Promise<void> {
  const { target, active } = liveTrackingStore.get()
  if (!active) return
  Taro.offLocationChange(onLocation)
  try {
    await Taro.stopLocationUpdate()
  } catch (_) {
    // 已停止
  }
  liveTrackingStore.set({ active: false })
  if (target) {
    // 必须在登出前写入，否则令牌失效
    await saveServerAttributes(target.id.entityType, target.id.id, { gpsActive: false }).catch(() => undefined)
  }
}

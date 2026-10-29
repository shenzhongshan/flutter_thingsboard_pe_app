import { DEFAULT_ALARM_FILTERS, type AlarmFilters } from '../core/alarm'
import { StorageKeys, getItem, setItem } from '../utils/storage'
import { createStore } from './createStore'

/** 告警筛选条件（跨页面共享：告警列表 ↔ 筛选页），持久化到本地。 */
export const alarmFiltersStore = createStore<{ filters: AlarmFilters }>({
  filters: { ...DEFAULT_ALARM_FILTERS, ...(getItem<AlarmFilters>(StorageKeys.alarmFilters) || {}) }
})

export function setAlarmFilters(filters: AlarmFilters) {
  alarmFiltersStore.set({ filters })
  setItem(StorageKeys.alarmFilters, filters)
}

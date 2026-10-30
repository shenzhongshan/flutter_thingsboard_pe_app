import Taro from '@tarojs/taro'

/** 本地持久化，对应 Flutter 版 ILocalDatabaseService（Hive）。 */
export function getItem<T = string>(key: string): T | undefined {
  try {
    const value = Taro.getStorageSync(key)
    return value === '' || value === undefined || value === null ? undefined : (value as T)
  } catch (_) {
    return undefined
  }
}

export function setItem(key: string, value: unknown): void {
  try {
    Taro.setStorageSync(key, value)
  } catch (_) {
    // 存储写满等异常不影响主流程
  }
}

export function removeItem(key: string): void {
  try {
    Taro.removeStorageSync(key)
  } catch (_) {
    // ignore
  }
}

export const StorageKeys = {
  endpoint: 'tb_endpoint',
  region: 'tb_region',
  token: 'tb_jwt_token',
  refreshToken: 'tb_refresh_token',
  alarmFilters: 'tb_alarm_filters',
  liveTracking: 'tb_live_tracking',
  dismissedVersion: 'tb_dismissed_version'
} as const

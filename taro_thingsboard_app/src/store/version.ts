import Taro from '@tarojs/taro'
import type { MobileVersionInfo } from '../api/types'
import { checkUpdate, type UpdateStatus } from '../core/version'
import { getAppVersion } from '../utils/appInfo'
import { Routes } from '../utils/router'
import { StorageKeys, getItem, setItem } from '../utils/storage'
import { applyMiniProgramUpdate } from '../utils/updater'
import { createStore } from './createStore'

/**
 * 版本检查状态，对应 Flutter 版 lib/modules/version（UpdateRequiredPage）。
 * 版本信息来自移动中心中该小程序应用的「版本信息」配置。
 */
export const versionStore = createStore<{ info: MobileVersionInfo | null; status: UpdateStatus }>({
  info: null,
  status: 'none'
})

let promptShown = false

/** 根据服务器返回的版本信息决定：强制更新页 / 可选更新提示 / 无需处理。 */
export function handleVersionInfo(info?: MobileVersionInfo | null) {
  const status = checkUpdate(getAppVersion(), info)
  versionStore.set({ info: info || null, status })
  if (status === 'required') {
    const pages = Taro.getCurrentPages()
    const current = pages[pages.length - 1]?.route || ''
    if (!current.includes('pages/update')) Taro.reLaunch({ url: Routes.update })
    return
  }
  if (status === 'available' && info?.latestVersion && !promptShown) {
    // 每个最新版本只提示一次
    if (getItem<string>(StorageKeys.dismissedVersion) === info.latestVersion) return
    promptShown = true
    Taro.showModal({
      title: `发现新版本 ${info.latestVersion}`,
      content: info.latestVersionReleaseNotes || '建议更新到最新版本以获得更好的体验。',
      confirmText: '立即更新',
      cancelText: '稍后'
    }).then(async ({ confirm }) => {
      if (!confirm) {
        setItem(StorageKeys.dismissedVersion, info.latestVersion)
        return
      }
      if (!(await applyMiniProgramUpdate())) {
        Taro.showToast({ title: '暂未获取到新版本，请稍后重新打开小程序', icon: 'none' })
      }
    })
  }
}

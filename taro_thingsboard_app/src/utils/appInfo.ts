import Taro from '@tarojs/taro'
import { FALLBACK_PKG_NAME, MOBILE_PKG_NAME_OVERRIDE } from '../config'

/**
 * 当前小程序的 AppID 与版本号。
 * 微信只在正式版中返回 miniProgram.version，开发版 / 体验版回退到构建时的 TB_APP_VERSION。
 */
function accountInfo(): { appId?: string; version?: string } {
  try {
    return Taro.getAccountInfoSync?.().miniProgram || {}
  } catch (_) {
    return {}
  }
}

export function getAppId(): string {
  return MOBILE_PKG_NAME_OVERRIDE || accountInfo().appId || FALLBACK_PKG_NAME
}

export function getAppVersion(): string {
  return accountInfo().version || TB_APP_VERSION
}

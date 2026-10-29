/**
 * 应用级配置，对应 Flutter 版 lib/constants/app_constants.dart 与
 * lib/utils/services/endpoint/endpoint_service.dart。
 */

/** 构建时固定的服务器地址；非空时隐藏区域选择（与 Flutter 版 ignoreRegionSelection 一致）。 */
export const FIXED_API_ENDPOINT: string = TB_API_ENDPOINT

/**
 * 调用 /api/mobile 接口获取移动端布局（底部导航、首页仪表板）时使用的包名与平台。
 * 需要在 ThingsBoard PE「移动中心 → 应用」中登记同名应用，否则服务器返回空布局，
 * 小程序会回退到按用户角色生成的默认布局。
 */
export const MOBILE_PKG_NAME: string = TB_MOBILE_PKG_NAME || 'org.thingsboard.pe.miniprogram'
export const MOBILE_PLATFORM: string = TB_MOBILE_PLATFORM || 'ANDROID'

export const NORTH_AMERICA_HOST = 'https://thingsboard.cloud'
export const EUROPE_HOST = 'https://eu.thingsboard.cloud'

export type Region = 'northAmerica' | 'europe' | 'custom'

export const REGIONS: { id: Region; label: string; host?: string }[] = [
  { id: 'northAmerica', label: '北美 (thingsboard.cloud)', host: NORTH_AMERICA_HOST },
  { id: 'europe', label: '欧洲 (eu.thingsboard.cloud)', host: EUROPE_HOST },
  { id: 'custom', label: '自定义服务器' }
]

export const DEFAULT_PAGE_SIZE = 20

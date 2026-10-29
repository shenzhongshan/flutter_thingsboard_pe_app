import type { EntityId } from '../api/types'
import { base64Encode } from '../utils/base64'
import { withQuery } from '../utils/url'

/**
 * 生成仪表板 state 参数（打开设备默认仪表板时定位到该设备），
 * 等价于 ThingsBoard Web 端的 objToBase64URI，对应 Flutter 版 Utils.createDashboardEntityState。
 */
export function createDashboardEntityState(
  entityId?: EntityId | null,
  opts: { entityName?: string; entityLabel?: string; stateId?: string } = {}
): string {
  const params: Record<string, unknown> = {}
  if (entityId) params.entityId = { entityType: entityId.entityType, id: entityId.id }
  if (opts.entityName) params.entityName = opts.entityName
  if (opts.entityLabel) params.entityLabel = opts.entityLabel
  const state: Record<string, unknown> = {}
  if (opts.stateId) state.id = opts.stateId
  state.params = params
  return base64Encode(JSON.stringify([state]))
}

/**
 * 仪表板在 web-view 中的地址：ThingsBoard Web UI 支持通过 accessToken / refreshToken
 * 查询参数直接建立会话（Flutter 版同样以此方式加载 WebView）。
 */
export function buildDashboardUrl(
  endpoint: string,
  dashboardId: string,
  tokens: { token?: string; refreshToken?: string },
  opts: { state?: string; hideToolbar?: boolean } = {}
): string {
  return withQuery(`${endpoint}/dashboard/${dashboardId}`, {
    accessToken: tokens.token,
    refreshToken: tokens.refreshToken,
    state: opts.state,
    hideToolbar: opts.hideToolbar ? 'true' : undefined
  })
}

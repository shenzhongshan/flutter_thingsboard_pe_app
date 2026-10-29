import { DEFAULT_PAGE_SIZE } from '../config'
import { http } from './http'
import type {
  AllowedPermissionsInfo,
  AuditLog,
  BaseEntity,
  DashboardInfo,
  Device,
  DeviceProfileInfo,
  EntityData,
  PageData,
  PageLink,
  User
} from './types'

/**
 * 实体列表与详情接口：客户、资产、租户、审计日志、仪表板、设备。
 * PE 版使用 /api/user/** 接口，按用户可见的实体组返回数据。
 */

export function pageQuery(link: Partial<PageLink>) {
  return {
    pageSize: link.pageSize ?? DEFAULT_PAGE_SIZE,
    page: link.page ?? 0,
    textSearch: link.textSearch,
    sortProperty: link.sortProperty,
    sortOrder: link.sortOrder
  }
}

export function getAllowedPermissions() {
  return http.get<AllowedPermissionsInfo>('/api/permissions/allowedPermissions')
}

/* ---------- 客户 / 资产 / 租户 ---------- */

export function getUserCustomers(link: Partial<PageLink>) {
  return http.get<PageData<BaseEntity & { title: string; email?: string; phone?: string; country?: string; city?: string; address?: string }>>(
    '/api/user/customers',
    pageQuery({ sortProperty: 'title', sortOrder: 'ASC', ...link })
  )
}

export function getCustomer(id: string) {
  return http.get<any>(`/api/customer/${id}`)
}

export function getUserAssets(link: Partial<PageLink>, type?: string) {
  return http.get<PageData<BaseEntity & { type: string; assetProfileId?: any }>>('/api/user/assets', {
    ...pageQuery({ sortProperty: 'createdTime', sortOrder: 'DESC', ...link }),
    type
  })
}

export function getAsset(id: string) {
  return http.get<any>(`/api/asset/${id}`)
}

export function getTenants(link: Partial<PageLink>) {
  return http.get<PageData<BaseEntity & { title: string; email?: string; phone?: string; country?: string; city?: string; address?: string }>>(
    '/api/tenants',
    pageQuery({ sortProperty: 'title', sortOrder: 'ASC', ...link })
  )
}

export function getTenant(id: string) {
  return http.get<any>(`/api/tenant/${id}`)
}

/* ---------- 审计日志 ---------- */

export function getAuditLogs(link: Partial<PageLink>) {
  return http.get<PageData<AuditLog>>(
    '/api/audit/logs',
    pageQuery({ sortProperty: 'createdTime', sortOrder: 'DESC', ...link })
  )
}

/* ---------- 仪表板 ---------- */

export function getUserDashboards(link: Partial<PageLink>) {
  return http.get<PageData<DashboardInfo>>('/api/user/dashboards', {
    ...pageQuery({ sortProperty: 'title', sortOrder: 'ASC', ...link }),
    mobile: true
  })
}

export function getDashboardInfo(id: string) {
  return http.get<DashboardInfo>(`/api/dashboard/info/${id}`, undefined, { silent: true })
}

/* ---------- 设备 ---------- */

export function getDeviceProfileInfos(link: Partial<PageLink>) {
  return http.get<PageData<DeviceProfileInfo>>(
    '/api/deviceProfileInfos',
    pageQuery({ sortProperty: 'name', sortOrder: 'ASC', ...link })
  )
}

export function getDeviceProfileInfo(id: string) {
  return http.get<DeviceProfileInfo>(`/api/deviceProfileInfo/${id}`, undefined, { silent: true })
}

export function getDevice(id: string) {
  return http.get<Device>(`/api/device/${id}`)
}

/**
 * 设备在线状态 active 的存储位置：默认是服务端属性；服务器开启
 * state.persistToTelemetry 时（/api/system/params 的 persistDeviceStateToTelemetry）存为遥测。
 * 与 ThingsBoard Web UI 的处理一致。
 */
let deviceStateKeyType: 'ATTRIBUTE' | 'TIME_SERIES' = 'ATTRIBUTE'

export function setPersistDeviceStateToTelemetry(value: boolean) {
  deviceStateKeyType = value ? 'TIME_SERIES' : 'ATTRIBUTE'
}

export function getSystemParams() {
  return http.get<{ persistDeviceStateToTelemetry?: boolean }>('/api/system/params', undefined, { silent: true })
}

const activeKeyFilter = (active: boolean) => ({
  key: { type: deviceStateKeyType, key: 'active' },
  valueType: 'BOOLEAN',
  predicate: {
    type: 'BOOLEAN',
    operation: 'EQUAL',
    value: { defaultValue: active }
  }
})

function deviceFilter(deviceType?: string) {
  return deviceType
    ? { type: 'deviceType', deviceTypes: [deviceType], deviceNameFilter: '' }
    : { type: 'entityType', entityType: 'DEVICE' }
}

/** 统计设备数量（在线/离线），对应 Flutter 版 EntityQueryApi.countDevices。 */
export function countDevices(params: { deviceType?: string; active?: boolean }) {
  return http.post<number>('/api/entitiesQuery/count', {
    entityFilter: deviceFilter(params.deviceType),
    keyFilters: params.active === undefined ? undefined : [activeKeyFilter(params.active)]
  })
}

/** 设备分页查询，对应 Flutter 版 EntityQueryApi.createDefaultDeviceQuery。 */
export function findDevices(params: {
  page: number
  pageSize?: number
  textSearch?: string
  deviceType?: string
  active?: boolean
}) {
  return http.post<PageData<EntityData>>('/api/entitiesQuery/find', {
    entityFilter: deviceFilter(params.deviceType),
    keyFilters: params.active === undefined ? undefined : [activeKeyFilter(params.active)],
    entityFields: [
      { type: 'ENTITY_FIELD', key: 'name' },
      { type: 'ENTITY_FIELD', key: 'type' },
      { type: 'ENTITY_FIELD', key: 'label' },
      { type: 'ENTITY_FIELD', key: 'createdTime' }
    ],
    latestValues: [{ type: deviceStateKeyType, key: 'active' }],
    pageLink: {
      pageSize: params.pageSize ?? DEFAULT_PAGE_SIZE,
      page: params.page,
      textSearch: params.textSearch || undefined,
      sortOrder: {
        key: { key: 'createdTime', type: 'ENTITY_FIELD' },
        direction: 'DESC'
      }
    }
  })
}

/** 读取 EntityData 中的字段值。 */
export function entityField(data: EntityData, key: string): string | undefined {
  return data.latest?.ENTITY_FIELD?.[key]?.value
}

export function isDeviceActive(data: EntityData): boolean {
  return data.latest?.[deviceStateKeyType]?.active?.value === 'true'
}

/* ---------- 属性 / 遥测 ---------- */

export function getAttributes(entityType: string, entityId: string, scope?: string) {
  const path = scope
    ? `/api/plugins/telemetry/${entityType}/${entityId}/values/attributes/${scope}`
    : `/api/plugins/telemetry/${entityType}/${entityId}/values/attributes`
  return http.get<{ key: string; value: any; lastUpdateTs: number }[]>(path, undefined, { silent: true })
}

export function getLatestTimeseries(entityType: string, entityId: string) {
  return http.get<Record<string, { ts: number; value: any }[]>>(
    `/api/plugins/telemetry/${entityType}/${entityId}/values/timeseries`,
    undefined,
    { silent: true }
  )
}

export function saveTelemetry(entityType: string, entityId: string, ts: number, values: Record<string, unknown>) {
  return http.post(`/api/plugins/telemetry/${entityType}/${entityId}/timeseries/ANY`, { ts, values }, { silent: true })
}

export function saveServerAttributes(entityType: string, entityId: string, attributes: Record<string, unknown>) {
  return http.post(`/api/plugins/telemetry/${entityType}/${entityId}/attributes/SERVER_SCOPE`, attributes, {
    silent: true
  })
}

/* ---------- 用户 ---------- */

export function saveUser(user: User) {
  return http.post<User>('/api/user', user)
}

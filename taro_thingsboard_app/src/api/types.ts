/** ThingsBoard PE REST 数据模型（只保留移动端用到的字段）。 */

export interface EntityId {
  id: string
  entityType: string
}

export interface PageLink {
  page: number
  pageSize: number
  textSearch?: string
  sortProperty?: string
  sortOrder?: 'ASC' | 'DESC'
}

export interface PageData<T> {
  data: T[]
  totalPages: number
  totalElements: number
  hasNext: boolean
}

export interface BaseEntity {
  id: EntityId
  createdTime: number
  name?: string
  label?: string
  additionalInfo?: Record<string, any> | null
}

export interface User extends BaseEntity {
  tenantId?: EntityId
  customerId?: EntityId
  email: string
  authority: string
  firstName?: string
  lastName?: string
  phone?: string
  additionalInfo?: Record<string, any> | null
}

export interface LoginResponse {
  token: string
  refreshToken?: string
  scope?: string
}

export interface OAuth2ClientLoginInfo {
  name: string
  icon?: string
  url: string
}

export interface LoginMobileInfo {
  oAuth2ClientLoginInfos?: OAuth2ClientLoginInfo[]
  selfRegistrationParams?: any
  versionInfo?: any
  storeInfo?: any
}

export interface HomeDashboardInfo {
  dashboardId?: EntityId
  hideDashboardToolbar?: boolean
}

export interface PageLayoutJson {
  id?: string
  label?: string
  icon?: string
  dashboardId?: string
  path?: string
  url?: string
  visible?: boolean
}

export interface UserMobileInfo {
  user?: User
  homeDashboardInfo?: HomeDashboardInfo | null
  pages?: PageLayoutJson[] | null
  versionInfo?: any
  storeInfo?: any
}

export interface MergedUserPermissions {
  genericPermissions?: Record<string, string[]>
  readGroupPermissions?: Record<string, { entityGroupIds?: string[] }>
  /** 部分 PE 版本只返回 groupPermissions（实体组 ID → 类型与操作） */
  groupPermissions?: Record<string, { entityType?: string; operations?: string[] }>
}

export interface AllowedPermissionsInfo {
  userPermissions?: MergedUserPermissions
  allowedResources?: string[] | null
}

export type AlarmSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR' | 'WARNING' | 'INDETERMINATE'
export type AlarmSearchStatus = 'ANY' | 'ACTIVE' | 'CLEARED' | 'ACK' | 'UNACK'

export interface AlarmInfo extends BaseEntity {
  type: string
  originator: EntityId
  originatorName?: string
  originatorLabel?: string
  severity: AlarmSeverity
  acknowledged: boolean
  cleared: boolean
  status?: string
  startTs: number
  endTs: number
  ackTs?: number
  clearTs?: number
  assignTs?: number
  assigneeId?: EntityId | null
  assignee?: { id: EntityId; firstName?: string; lastName?: string; email: string } | null
  details?: any
}

export interface AlarmComment {
  id?: EntityId
  createdTime: number
  alarmId?: EntityId
  userId?: EntityId
  type: 'SYSTEM' | 'OTHER'
  comment: { text: string; edited?: boolean; editedOn?: number; subtype?: string; [k: string]: any }
  firstName?: string
  lastName?: string
  email?: string
}

export interface UserInfoShort {
  id: EntityId
  email: string
  firstName?: string
  lastName?: string
}

export interface DeviceProfileInfo {
  id: EntityId
  name: string
  type?: string
  transportType?: string
  image?: string | null
  defaultDashboardId?: EntityId | null
}

export interface EntityData {
  entityId: EntityId
  latest: Record<string, Record<string, { ts: number; value: string }>>
}

export interface Device extends BaseEntity {
  type: string
  deviceProfileId: EntityId
  customerId?: EntityId
  ownerId?: EntityId
}

export interface DashboardInfo extends BaseEntity {
  title: string
  image?: string | null
  mobileHide?: boolean
  mobileOrder?: number
}

export interface Notification {
  id: EntityId
  createdTime: number
  subject: string
  text: string
  type: string
  status: 'SENT' | 'READ'
  info?: {
    type?: string
    alarmId?: string
    alarmType?: string
    alarmSeverity?: AlarmSeverity
    alarmStatus?: string
    stateEntityId?: EntityId
    dashboardId?: EntityId
    actionButtonConfig?: { enabled?: boolean; text?: string; linkType?: string; link?: string; dashboardId?: string }
    [k: string]: any
  }
  additionalConfig?: { icon?: { enabled?: boolean; icon?: string; color?: string } }
}

export interface AuditLog {
  id: EntityId
  createdTime: number
  entityId?: EntityId
  entityName?: string
  userName?: string
  actionType: string
  actionData?: any
  actionStatus: 'SUCCESS' | 'FAILURE'
  actionFailureDetails?: string
}

export interface TwoFaProviderInfo {
  type: 'TOTP' | 'SMS' | 'EMAIL' | 'BACKUP_CODE'
  default?: boolean
  contact?: string
  minVerificationCodeSendPeriod?: number
}

/** 实体类型、审计操作类型的中文名称（对应 Flutter 版 translation_utils.dart）。 */

const ENTITY_TYPES: Record<string, string> = {
  DEVICE: '设备',
  ASSET: '资产',
  CUSTOMER: '客户',
  TENANT: '租户',
  USER: '用户',
  DASHBOARD: '仪表板',
  ALARM: '告警',
  RULE_CHAIN: '规则链',
  ENTITY_VIEW: '实体视图',
  DEVICE_PROFILE: '设备配置',
  ASSET_PROFILE: '资产配置',
  ENTITY_GROUP: '实体组',
  CONVERTER: '数据转换器',
  INTEGRATION: '集成',
  SCHEDULER_EVENT: '调度事件',
  BLOB_ENTITY: '文件',
  ROLE: '角色',
  GROUP_PERMISSION: '组权限',
  EDGE: '边缘',
  OTA_PACKAGE: 'OTA 包',
  TB_RESOURCE: '资源',
  NOTIFICATION_TARGET: '通知接收者',
  NOTIFICATION_TEMPLATE: '通知模板',
  NOTIFICATION_RULE: '通知规则',
  MOBILE_APP: '移动应用',
  MOBILE_APP_BUNDLE: '移动应用包',
  API_USAGE_STATE: 'API 用量'
}

const ACTION_TYPES: Record<string, string> = {
  ADDED: '新增',
  DELETED: '删除',
  UPDATED: '更新',
  ATTRIBUTES_UPDATED: '属性更新',
  ATTRIBUTES_DELETED: '属性删除',
  TIMESERIES_UPDATED: '遥测更新',
  TIMESERIES_DELETED: '遥测删除',
  RPC_CALL: 'RPC 调用',
  CREDENTIALS_UPDATED: '凭据更新',
  ASSIGNED_TO_CUSTOMER: '分配给客户',
  UNASSIGNED_FROM_CUSTOMER: '取消分配客户',
  ACTIVATED: '激活',
  SUSPENDED: '停用',
  CREDENTIALS_READ: '读取凭据',
  ATTRIBUTES_READ: '读取属性',
  RELATION_ADD_OR_UPDATE: '关系新增/更新',
  RELATION_DELETED: '关系删除',
  RELATIONS_DELETED: '关系全部删除',
  ALARM_ACK: '告警确认',
  ALARM_CLEAR: '告警清除',
  ALARM_DELETE: '告警删除',
  ALARM_ASSIGNED: '告警指派',
  ALARM_UNASSIGNED: '告警取消指派',
  ADDED_COMMENT: '添加评论',
  UPDATED_COMMENT: '更新评论',
  DELETED_COMMENT: '删除评论',
  LOGIN: '登录',
  LOGOUT: '登出',
  LOCKOUT: '账户锁定',
  ASSIGNED_FROM_TENANT: '从租户分配',
  ASSIGNED_TO_TENANT: '分配给租户',
  PROVISION_SUCCESS: '预配置成功',
  PROVISION_FAILURE: '预配置失败',
  ASSIGNED_TO_EDGE: '分配给边缘',
  UNASSIGNED_FROM_EDGE: '取消分配边缘',
  ADDED_TO_ENTITY_GROUP: '加入实体组',
  REMOVED_FROM_ENTITY_GROUP: '移出实体组',
  REST_API_RULE_ENGINE_CALL: 'REST API 规则引擎调用',
  MADE_PUBLIC: '设为公开',
  MADE_PRIVATE: '设为私有',
  CHANGE_OWNER: '更改所有者',
  SMS_SENT: '发送短信'
}

export function entityTypeLabel(type?: string): string {
  if (!type) return '-'
  return ENTITY_TYPES[type] || type
}

export function actionTypeLabel(type?: string): string {
  if (!type) return '-'
  return ACTION_TYPES[type] || type
}

export const AUTHORITY_LABELS: Record<string, string> = {
  SYS_ADMIN: '系统管理员',
  TENANT_ADMIN: '租户管理员',
  CUSTOMER_USER: '客户用户'
}

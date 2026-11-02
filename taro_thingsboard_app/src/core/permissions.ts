import type { AllowedPermissionsInfo } from '../api/types'

/**
 * PE 版 RBAC 权限判断，移植自 Flutter 版 lib/thingsboard_client_extensions.dart
 * （与 Web 端 user-permissions.service.ts 保持一致）。
 */

export function hasGenericPermission(
  info: AllowedPermissionsInfo | null | undefined,
  resource: string,
  operation: string
): boolean {
  const generic = info?.userPermissions?.genericPermissions
  if (!generic) return false
  const ops = generic[resource]
  if (ops && (ops.includes('ALL') || ops.includes(operation))) return true
  // Resource.ALL 通配只对当前角色允许的资源生效
  const allowed = info?.allowedResources
  if (allowed && !allowed.includes(resource)) return false
  const allOps = generic.ALL
  return !!allOps && (allOps.includes('ALL') || allOps.includes(operation))
}

export function hasReadGenericPermission(info: AllowedPermissionsInfo | null | undefined, resource: string) {
  return hasGenericPermission(info, resource, 'READ')
}

export function hasSharedReadGroupsPermission(info: AllowedPermissionsInfo | null | undefined, entityType: string) {
  const ids = info?.userPermissions?.readGroupPermissions?.[entityType]?.entityGroupIds
  if (ids && ids.length > 0) return true
  // 兼容不返回 readGroupPermissions 的服务器版本：检查共享给用户的实体组权限
  const groups = info?.userPermissions?.groupPermissions
  if (!groups) return false
  return Object.keys(groups).some((id) => {
    const g = groups[id]
    return g?.entityType === entityType && !!g.operations && (g.operations.includes('READ') || g.operations.includes('ALL'))
  })
}

export function hasReadGenericOrSharedGroupsPermission(
  info: AllowedPermissionsInfo | null | undefined,
  resource: string,
  entityType: string
) {
  return hasReadGenericPermission(info, resource) || hasSharedReadGroupsPermission(info, entityType)
}

import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createDashboardEntityState, buildDashboardUrl } from '../src/core/dashboard'
import { buildNavigation, defaultPageLayouts, navTargetForLayout, parsePageLayouts } from '../src/core/navigation'
import { hasGenericPermission, hasReadGenericOrSharedGroupsPermission } from '../src/core/permissions'
import { base64Decode, base64Encode } from '../src/utils/base64'
import { decodeJwt, isTokenExpired } from '../src/utils/jwt'
import { normalizeEndpoint, parseUrl, readParam, withQuery } from '../src/utils/url'

test('base64 round-trips unicode and matches Buffer', () => {
  for (const s of ['', 'a', 'ab', 'abc', '设备 ✓ 🚀', '{"id":"x"}']) {
    assert.equal(base64Encode(s), Buffer.from(s, 'utf8').toString('base64'))
    assert.equal(base64Decode(base64Encode(s)), s)
  }
  // base64url（JWT）也能解码
  assert.equal(base64Decode(Buffer.from('?>?>').toString('base64url')), '?>?>')
})

function jwt(claims: object) {
  return `x.${Buffer.from(JSON.stringify(claims)).toString('base64url')}.y`
}

test('decodeJwt reads authority from scopes', () => {
  const user = decodeJwt(jwt({ sub: 'a@b.c', scopes: ['TENANT_ADMIN'], userId: 'u1', exp: 9999999999 }))
  assert.equal(user?.authority, 'TENANT_ADMIN')
  assert.equal(user?.userId, 'u1')
  assert.equal(isTokenExpired(jwt({ scopes: [], exp: 1 })), true)
  assert.equal(isTokenExpired(jwt({ scopes: [], exp: Date.now() / 1000 + 3600 })), false)
  assert.equal(decodeJwt('garbage'), null)
})

test('url helpers', () => {
  assert.equal(withQuery('/api/x', { a: 1, b: undefined, c: ['A', 'B'], d: '' }), '/api/x?a=1&c=A%2CB')
  const parsed = parseUrl('https://Demo.Example.com:8080/api/noauth/qr?secret=abc%20d&host=https%3A%2F%2Fh')
  assert.deepEqual(parsed, {
    origin: 'https://demo.example.com:8080',
    path: '/api/noauth/qr',
    query: { secret: 'abc d', host: 'https://h' }
  })
  assert.equal(parseUrl('not a url'), null)
  assert.equal(normalizeEndpoint(' iot.example.com/ '), 'https://iot.example.com')
  assert.equal(readParam('%E8%AE%BE%E5%A4%87'), '设备')
  assert.equal(readParam('设备'), '设备')
})

test('dashboard entity state matches the web UI objToBase64URI encoding', () => {
  const state = createDashboardEntityState({ entityType: 'DEVICE', id: 'd1' }, { entityName: '温度计' })
  const json = [{ params: { entityId: { entityType: 'DEVICE', id: 'd1' }, entityName: '温度计' } }]
  // Web 端：btoa(unescape(encodeURIComponent(JSON.stringify(obj))))
  assert.equal(state, Buffer.from(JSON.stringify(json), 'utf8').toString('base64'))
  const url = buildDashboardUrl('https://tb', 'dash', { token: 't', refreshToken: 'r' }, { state, hideToolbar: true })
  assert.ok(url.startsWith('https://tb/dashboard/dash?accessToken=t&refreshToken=r&state='))
  assert.ok(url.endsWith('&hideToolbar=true'))
})

const tenantPerms = {
  userPermissions: {
    genericPermissions: { ALARM: ['READ'], DEVICE_PROFILE: ['ALL'] },
    readGroupPermissions: { CUSTOMER: { entityGroupIds: ['g1'] }, ASSET: { entityGroupIds: [] } }
  },
  allowedResources: ['ALARM', 'DEVICE_PROFILE', 'DEVICE', 'ASSET', 'CUSTOMER', 'DASHBOARD']
}

test('PE permission checks mirror the web UI', () => {
  assert.equal(hasGenericPermission(tenantPerms, 'ALARM', 'READ'), true)
  assert.equal(hasGenericPermission(tenantPerms, 'ALARM', 'WRITE'), false)
  assert.equal(hasGenericPermission(tenantPerms, 'DEVICE_PROFILE', 'WRITE'), true)
  assert.equal(hasReadGenericOrSharedGroupsPermission(tenantPerms, 'CUSTOMER', 'CUSTOMER'), true)
  assert.equal(hasReadGenericOrSharedGroupsPermission(tenantPerms, 'ASSET', 'ASSET'), false)
  const all = { userPermissions: { genericPermissions: { ALL: ['ALL'] } }, allowedResources: ['DEVICE'] }
  assert.equal(hasGenericPermission(all, 'DEVICE', 'READ'), true)
  // ALL 通配不覆盖角色不允许的资源
  assert.equal(hasGenericPermission(all, 'AUDIT_LOG', 'READ'), false)
  assert.equal(hasGenericPermission(null, 'DEVICE', 'READ'), false)
})

test('default layouts follow the Flutter app per authority', () => {
  assert.deepEqual(defaultPageLayouts('SYS_ADMIN').map((p) => p.id), ['home', 'devices', 'notifications'])
  assert.deepEqual(defaultPageLayouts('CUSTOMER_USER').map((p) => p.id), ['home', 'alarms', 'devices', 'assets', 'notifications'])
  assert.equal(defaultPageLayouts('TENANT_ADMIN').length, 7)
})

test('buildNavigation: 3 items + More, RBAC filtering and Profile fallback', () => {
  const nav = buildNavigation(null, 'TENANT_ADMIN', tenantPerms)
  // assets / audit_logs 被权限过滤掉
  assert.deepEqual(nav.bottomBar.map((i) => i.key), ['home', 'alarms', 'devices', 'more'])
  assert.deepEqual(nav.more.map((i) => i.key), ['customers', 'notifications'])
  assert.equal(nav.more[1].showNotificationBadge, true)

  const small = buildNavigation(parsePageLayouts([{ id: 'home' }, { id: 'ALARMS', label: '我的告警' }]), 'CUSTOMER_USER', null)
  assert.deepEqual(small.bottomBar.map((i) => i.key), ['home', 'alarms', 'profile'])
  assert.equal(small.bottomBar[1].title, '我的告警')
  assert.deepEqual(small.more, [])

  // 未加载权限时不隐藏页面
  assert.equal(buildNavigation(null, 'TENANT_ADMIN', null).more.length, 4)
})

test('custom pages map to dashboard / url targets', () => {
  const pages = parsePageLayouts([
    { label: 'Plant', dashboardId: '784f394c-42b6-435a-983c-b7beff2784f9', icon: 'mdi:factory' },
    { label: 'Docs', url: 'https://thingsboard.io/docs' },
    { label: 'Old', path: '/url/https%3A%2F%2Fexample.com' },
    { label: 'Hidden', id: 'alarms', visible: false }
  ])!
  assert.equal(pages.length, 3)
  assert.deepEqual(navTargetForLayout(pages[0]), { kind: 'dashboard', dashboardId: '784f394c-42b6-435a-983c-b7beff2784f9' })
  assert.deepEqual(navTargetForLayout(pages[1]), { kind: 'url', url: 'https://thingsboard.io/docs' })
  assert.deepEqual(navTargetForLayout(pages[2]), { kind: 'url', url: 'https://example.com' })
  assert.equal(buildNavigation(pages, 'TENANT_ADMIN', null).bottomBar[0].icon, 'factory')
})

test('shared group read falls back to groupPermissions', () => {
  const info = {
    userPermissions: {
      genericPermissions: {},
      groupPermissions: { g1: { entityType: 'CUSTOMER', operations: ['READ', 'RPC_CALL'] }, g2: { entityType: 'ASSET', operations: ['WRITE'] } }
    }
  }
  assert.equal(hasReadGenericOrSharedGroupsPermission(info, 'CUSTOMER', 'CUSTOMER'), true)
  assert.equal(hasReadGenericOrSharedGroupsPermission(info, 'ASSET', 'ASSET'), false)
  assert.equal(hasReadGenericOrSharedGroupsPermission(info, 'DEVICE', 'DEVICE'), false)
})

test('version comparison and update status', async () => {
  const { checkUpdate, compareVersions } = await import('../src/core/version')
  assert.equal(compareVersions('1.2.3', '1.2.3'), 0)
  assert.ok(compareVersions('1.2.3', '1.10.0') < 0)
  assert.ok(compareVersions('2.0.0', '1.99.99') > 0)
  assert.equal(compareVersions('1.2', '1.2.0'), 0)
  assert.equal(compareVersions('1.2.3-beta+5', '1.2.3'), 0)
  assert.equal(compareVersions('garbage', '1.0.0'), 0)
  assert.equal(checkUpdate('1.0.0', null), 'none')
  assert.equal(checkUpdate('1.0.0', { minVersion: '1.1.0', latestVersion: '1.2.0' }), 'required')
  assert.equal(checkUpdate('1.1.0', { minVersion: '1.1.0', latestVersion: '1.2.0' }), 'available')
  assert.equal(checkUpdate('1.2.0', { minVersion: '1.1.0', latestVersion: '1.2.0' }), 'none')
  assert.equal(checkUpdate('1.0.0', { minVersion: '', latestVersion: null }), 'none')
})

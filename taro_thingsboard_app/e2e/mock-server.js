const http = require('http')
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
const mkJwt = (scopes, extra = {}) =>
  `${b64({ alg: 'HS512' })}.${b64({ sub: 'tenant@thingsboard.org', scopes, userId: 'u1', firstName: 'Tenant', lastName: 'Admin', exp: Math.floor(Date.now() / 1000) + 3600, ...extra })}.sig`
const jwtUserId = (req) => { try { return JSON.parse(Buffer.from(req.headers['x-authorization'].split('.')[1], 'base64url')).userId } catch (_) { return null } }
const id = (t, i) => ({ entityType: t, id: i })
const page = (data) => ({ data, totalPages: 1, totalElements: data.length, hasNext: false })
const log = []
let alarm = {
  id: id('ALARM', 'a1'), createdTime: Date.now() - 600000, type: 'High Temperature', originator: id('DEVICE', 'd1'),
  originatorName: 'Thermometer A', severity: 'CRITICAL', acknowledged: false, cleared: false, startTs: Date.now() - 600000,
  endTs: Date.now(), assignee: null, details: { temperature: 87 }
}
let comments = [{ id: id('ALARM_COMMENT', 'c1'), createdTime: Date.now() - 500000, type: 'SYSTEM', comment: { text: 'Alarm created' } }]
let notifications = [
  { id: id('NOTIFICATION', 'n1'), createdTime: Date.now() - 60000, subject: '设备离线', text: 'Thermometer B 已离线', type: 'DEVICE_ACTIVITY', status: 'SENT', info: {} },
  { id: id('NOTIFICATION', 'n2'), createdTime: Date.now() - 120000, subject: '新告警', text: 'High Temperature on Thermometer A', type: 'ALARM', status: 'SENT', info: { alarmId: 'a1', alarmSeverity: 'CRITICAL' } }
]
const routes = {
  'POST /api/auth/login': (b) => b.username === 'tenant@thingsboard.org' && b.password === 'tenant'
    ? [200, { token: mkJwt(['TENANT_ADMIN']), refreshToken: 'r1' }]
    : b.username === 'other@x.com' ? [200, { token: mkJwt(['TENANT_ADMIN'], { sub: 'other@x.com', userId: 'u9' }), refreshToken: 'r9' }]
    : b.username === 'mfa@x.com' ? [200, { token: mkJwt(['PRE_VERIFICATION_TOKEN']) }]
    : [401, { message: 'Invalid username or password', errorCode: 10 }],
  'GET /api/auth/2fa/providers': () => [200, [{ type: 'TOTP', default: true }, { type: 'EMAIL', contact: 'm***@x.com', minVerificationCodeSendPeriod: 30 }]],
  'POST /api/auth/2fa/verification/check': (b, q) => q.verificationCode === '123456' ? [200, { token: mkJwt(['TENANT_ADMIN']), refreshToken: 'r2' }] : [400, { message: 'Verification code is incorrect' }],
  'GET /api/noauth/mobile': () => [200, { oAuth2ClientLoginInfos: [{ name: 'Google', url: '/oauth2/google' }] }],
  'GET /api/auth/user': () => [200, { id: id('USER', 'u1'), email: 'tenant@thingsboard.org', authority: 'TENANT_ADMIN', firstName: 'Tenant', lastName: 'Admin', createdTime: 1 }],
  'POST /api/user': (b) => [200, b],
  'GET /api/mobile': (b, q, req) => jwtUserId(req) === 'u9' ? [403, { message: 'Mobile application belongs to another tenant', errorCode: 20 }] : [200, { homeDashboardInfo: { dashboardId: id('DASHBOARD', 'home-d') }, pages: null }],
  'GET /api/permissions/allowedPermissions': () => [200, { userPermissions: { genericPermissions: { ALL: ['ALL'] }, readGroupPermissions: {} }, allowedResources: null }],
  'GET /api/dashboard/info/home-d': () => [200, { id: id('DASHBOARD', 'home-d'), title: '工厂总览', createdTime: 1 }],
  'GET /api/user/dashboards': () => [200, page([{ id: id('DASHBOARD', 'd-1'), title: '温度监控', createdTime: 1 }, { id: id('DASHBOARD', 'd-2'), title: '能耗分析', createdTime: 1 }])],
  'GET /api/v2/alarms': (b, q) => [200, page(q.statusList && q.statusList.includes('CLEARED') && !alarm.cleared ? [] : [alarm])],
  'GET /api/alarm/info/a1': () => [200, alarm],
  'POST /api/alarm/a1/ack': () => { alarm = { ...alarm, acknowledged: true, ackTs: Date.now() }; comments.unshift({ id: id('ALARM_COMMENT', 'c' + Date.now()), createdTime: Date.now(), type: 'SYSTEM', comment: { text: 'Alarm was acknowledged by user Tenant Admin' } }); return [200, alarm] },
  'POST /api/alarm/a1/clear': () => { alarm = { ...alarm, cleared: true, clearTs: Date.now() }; return [200, alarm] },
  'GET /api/alarm/a1/comment': () => [200, page(comments)],
  'POST /api/alarm/a1/comment': (b) => { const c = { id: id('ALARM_COMMENT', 'c' + Date.now()), createdTime: Date.now(), type: 'OTHER', userId: id('USER', 'u1'), firstName: 'Tenant', lastName: 'Admin', comment: b.comment }; comments.unshift(c); return [200, c] },
  'GET /api/users/assign/a1': () => [200, page([{ id: id('USER', 'u2'), email: 'bob@x.com', firstName: 'Bob' }])],
  'POST /api/alarm/a1/assign/u2': () => { alarm = { ...alarm, assigneeId: id('USER', 'u2'), assignee: { id: id('USER', 'u2'), email: 'bob@x.com', firstName: 'Bob' } }; return [200, alarm] },
  'GET /api/alarm/types': () => [200, page([{ type: 'High Temperature' }, { type: 'Low Battery' }])],
  'GET /api/users/info': () => [200, page([{ id: id('USER', 'u2'), email: 'bob@x.com', firstName: 'Bob' }])],
  'GET /api/deviceProfileInfos': () => [200, page([{ id: id('DEVICE_PROFILE', 'p1'), name: 'thermometer', defaultDashboardId: id('DASHBOARD', 'd-1') }, { id: id('DEVICE_PROFILE', 'p2'), name: 'default' }])],
  'POST /api/entitiesQuery/count': (b) => [200, b.keyFilters ? (b.keyFilters[0].predicate.value.defaultValue ? 3 : 2) : 5],
  'POST /api/entitiesQuery/find': (b) => [200, page([
    { entityId: id('DEVICE', 'd1'), latest: { ENTITY_FIELD: { name: { value: 'Thermometer A' }, type: { value: 'thermometer' }, label: { value: '' }, createdTime: { value: String(Date.now()) } }, ATTRIBUTE: { active: { value: 'true' } } } },
    { entityId: id('DEVICE', 'd2'), latest: { ENTITY_FIELD: { name: { value: 'Thermometer B' }, type: { value: 'thermometer' }, label: { value: '车间 2' }, createdTime: { value: String(Date.now()) } }, ATTRIBUTE: { active: { value: 'false' } } } }
  ].filter((d) => !b.keyFilters || String(b.keyFilters[0].predicate.value.defaultValue) === d.latest.ATTRIBUTE.active.value))],
  'GET /api/device/d1': () => [200, { id: id('DEVICE', 'd1'), name: 'Thermometer A', type: 'thermometer', deviceProfileId: id('DEVICE_PROFILE', 'p1'), createdTime: Date.now() }],
  'GET /api/deviceProfileInfo/p1': () => [200, { id: id('DEVICE_PROFILE', 'p1'), name: 'thermometer', defaultDashboardId: id('DASHBOARD', 'd-1') }],
  'GET /api/plugins/telemetry/DEVICE/d1/values/attributes': () => [200, [{ key: 'active', value: true, lastUpdateTs: Date.now() }, { key: 'fw', value: '1.2.0', lastUpdateTs: Date.now() }]],
  'GET /api/plugins/telemetry/DEVICE/d1/values/timeseries': () => [200, { temperature: [{ ts: Date.now(), value: '23.5' }], humidity: [{ ts: Date.now(), value: '41' }] }],
  'GET /api/user/customers': () => [200, page([{ id: id('CUSTOMER', 'cu1'), title: 'Customer A', email: 'a@cust.com', createdTime: 1 }])],
  'GET /api/customer/cu1': () => [200, { id: id('CUSTOMER', 'cu1'), title: 'Customer A', email: 'a@cust.com', city: 'Shanghai', createdTime: 1 }],
  'GET /api/user/assets': () => [200, page([{ id: id('ASSET', 'as1'), name: 'Building 1', type: 'building', createdTime: 1 }])],
  'GET /api/audit/logs': () => [200, page([{ id: id('AUDIT_LOG', 'l1'), createdTime: Date.now(), entityId: id('DEVICE', 'd1'), entityName: 'Thermometer A', userName: 'tenant@thingsboard.org', actionType: 'UPDATED', actionStatus: 'SUCCESS', actionData: { x: 1 } }])],
  'GET /api/notifications': (b, q) => [200, page(notifications.filter((n) => q.unreadOnly !== 'true' || n.status !== 'READ'))],
  'GET /api/notifications/unread/count': () => [200, notifications.filter((n) => n.status !== 'READ').length],
  'PUT /api/notifications/read': () => { notifications = notifications.map((n) => ({ ...n, status: 'READ' })); return [200, null] },
  'POST /api/auth/logout': () => [200, null]
}
http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Authorization')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end() }
  let body = ''
  req.on('data', (c) => (body += c))
  req.on('end', () => {
    const [path, qs = ''] = req.url.split('?')
    const q = Object.fromEntries(new URLSearchParams(qs))
    log.push(`${req.method} ${req.url}`)
    let key = `${req.method} ${path}`
    let m = req.method === 'PUT' && /^\/api\/notification\/(.+)\/read$/.exec(path)
    let h = routes[key]
    if (m) h = () => { notifications = notifications.map((n) => (n.id.id === m[1] ? { ...n, status: 'READ' } : n)); return [200, null] }
    if (!h) { console.log('UNMOCKED', key); res.writeHead(404, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ message: 'not mocked ' + key })) }
    const needsAuth = !path.startsWith('/api/noauth') && path !== '/api/auth/login'
    if (needsAuth && !req.headers['x-authorization']) { res.writeHead(401, { 'Content-Type': 'application/json' }); return res.end('{"message":"unauthorized"}') }
    let parsed = {}
    try { parsed = body ? JSON.parse(body) : {} } catch (_) {}
    const [status, data] = h(parsed, q, req)
    res.writeHead(status, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify(data))
  })
}).listen(9090, () => console.log('mock on 9090'))
// 用法：node e2e/mock-server.js（模拟 ThingsBoard PE REST 接口，端口 9090）
process.on('SIGTERM', () => process.exit(0))

# ThingsBoard PE 微信小程序（Taro 版）

基于 [京东 Taro](https://taro-docs.jd.com/) 4.x（React + TypeScript）多端统一框架，复刻本仓库 Flutter 版 ThingsBoard PE 移动 App 的功能。
一套代码可编译为 **微信小程序**（主要目标）、H5、支付宝 / 抖音小程序等。

## 快速开始

```bash
cd taro_thingsboard_app
npm install
npm run dev:weapp          # 开发模式，输出到 dist/weapp
npm run build:weapp        # 生产构建
npm run build:h5           # H5 版本
npm test                   # 核心逻辑单元测试
npm run typecheck
```

用微信开发者工具打开 `taro_thingsboard_app` 目录（`project.config.json` 指向 `dist/weapp`），
并把 `appid` 改为自己的小程序 AppID。

### 构建参数（环境变量）

| 变量 | 作用 | 默认值 |
| --- | --- | --- |
| `TB_API_ENDPOINT` | 固定服务器地址，设置后隐藏「选择服务器」（对应 Flutter 版 `thingsboardApiEndpoint`） | 空（由用户选择） |
| `TB_MOBILE_PKG_NAME` | 查询移动中心时使用的包名 | 当前小程序的 AppID（运行时读取） |
| `TB_MOBILE_PLATFORM` | 查询移动中心时使用的平台 | `WECHAT_MINIPROGRAM`，服务器不支持时自动回退为 `ANDROID` |
| `TB_APP_VERSION` | 开发版 / 体验版的版本号（正式版使用微信返回的版本号） | `package.json` 中的 `version` |

```bash
TB_API_ENDPOINT=https://iot.example.com npm run build:weapp
```

### 移动中心配置

小程序通过 `/api/mobile` 获取底部导航、首页仪表板与版本信息：

- **pe2ce 服务器（支持微信小程序平台）**：在「移动中心 → 应用」中新增平台为「微信小程序」的应用，包名填小程序 AppID，
  再在「移动中心 → 应用包」中把它选为「微信小程序应用」并配置布局。无需任何构建参数。
- **原版 ThingsBoard**：服务器不认识 `WECHAT_MINIPROGRAM`，小程序会自动改用 `ANDROID` 平台、包名
  `org.thingsboard.pe.miniprogram`（可用 `TB_MOBILE_PKG_NAME` 覆盖）。在移动中心登记一个同名 Android 应用即可。
- 两种情况下都没有登记时，按用户角色使用默认导航。

### 版本检查

移动中心应用中的「版本信息」对小程序同样生效（对应 Flutter 版的强制更新页）：

- 当前版本低于**最低版本**：进入「需要更新」页，显示最低版本的更新说明，点击「立即更新」通过微信 `UpdateManager` 下载并重启；
- 低于**最新版本**：弹窗提示一次，可选择稍后（每个最新版本只提示一次）。

正式版的版本号就是上传代码时填写的版本号，请与移动中心中配置的版本保持同一格式（如 `1.2.0`）。

### 微信公众平台配置（必需）

1. **服务器域名 → request 合法域名**：添加 ThingsBoard 服务器域名（必须 HTTPS）。
2. **业务域名**：添加同一域名，并按提示把校验文件放到服务器根目录 —— 仪表板通过 `<web-view>` 加载 ThingsBoard Web UI。
   个人主体小程序无法使用 `web-view`，仪表板功能需要企业主体。
3. 实时位置追踪使用了 `startLocationUpdate` / `onLocationChange`，需在「用户隐私保护指引」中声明位置信息。

## 功能对照

| Flutter 版模块 | 小程序实现 | 说明 |
| --- | --- | --- |
| 登录 / 选择区域 (`core/auth/login`, `select_region`) | `pages/login`、`pages/region` | 北美 / 欧洲 / 自定义服务器 |
| 双因素认证 (`core/auth/2FA/confirm`) | `pages/two-factor` | TOTP / 短信 / 邮箱 / 备用码，支持切换方式、重发倒计时 |
| 忘记密码 (`core/auth/reset_password`) | `pages/reset-password` | |
| 扫码登录 (`core/auth/noauth`) | 登录页「扫码登录」 | 扫描 Web 端移动应用二维码，`/api/noauth/qr/{secret}` 换取令牌 |
| 版本检查 (`modules/version`) | `store/version.ts`、`pages/update` | 最低版本强制更新、最新版本提示 |
| 动态底部导航 (`modules/main`) | `pages/main` + `core/navigation.ts` | 服务器布局 / 角色默认布局，PE RBAC 过滤，3 项 + 更多（少于 4 项时为个人资料） |
| 首页 (`modules/home`) | `views/HomeView` | 首页仪表板入口 + 仪表板列表；系统管理员显示租户列表 |
| 仪表板 (`modules/dashboard`) | `pages/dashboard`（web-view） | 通过 `accessToken`/`refreshToken` 参数建立会话；支持 `state` 定位实体 |
| 告警 (`modules/alarm`) | `views/AlarmsView`、`pages/alarm-detail`、`pages/alarm-filter` | 搜索、状态/严重程度/类型/指派人筛选，确认、清除、指派，活动评论（增改删） |
| 设备 (`modules/device`) | `views/DevicesView`、`views/DeviceListView`、`pages/device-detail` | 设备配置网格 + 在线/离线统计，列表筛选，详情含遥测与属性，打开设备默认仪表板 |
| 客户 / 资产 / 租户 / 审计日志 | `views/EntityListView`、`pages/entity-detail` | |
| 通知 (`modules/notification`) | `views/NotificationsView` | 未读/全部，标记已读、全部已读、删除，点击跳转告警/仪表板/链接，底部角标轮询 |
| 更多 / 个人资料 / 修改密码 | `views/MoreView`、`views/ProfileView`、`pages/change-password` | |
| 自定义页面（URL / 仪表板） | `pages/webview`、`pages/dashboard` | |
| 实时位置追踪 | `pages/live-tracking` | 见下方差异说明 |

## 与 Flutter 版的差异 / 限制

- **OAuth2 第三方登录**：小程序无法打开外部授权页并接收回调，暂不支持；可在 Web 端生成二维码后「扫码登录」。
- **推送通知（Firebase）**：小程序无 FCM，改为在主界面轮询未读数量（30 秒）。如需服务通知，可接入微信订阅消息。
- **仪表板移动端动作**（扫码、拍照、定位等 JS Bridge）：`web-view` 无法与小程序原生通信，这些动作不可用。
- **实时位置追踪**：Flutter 版由仪表板动作下发配置；小程序改为用户手动选择目标设备，固定键名上报（遥测 `latitude/longitude/accuracy/altitude/speed`，服务端属性 `gpsActive/gpsTrackedBy`），切后台后暂停。
- **设备配网（BLE / SoftAP / ESP SmartConfig）**、自助注册、2FA 首次配置、多语言切换：未实现。2FA 未配置但平台强制要求时提示到 Web 端完成配置。
- 图标：内置常用 Material 图标，服务器配置的未知图标名回退为链接图标。

## 目录结构

```
src/
  api/          REST 接口（http.ts：令牌、自动刷新、错误提示）
  core/         纯逻辑：导航布局、PE 权限、告警常量、仪表板 URL/state
  store/        全局状态（登录态、告警筛选、位置追踪）
  components/   通用组件（分页列表、搜索框、图标等）
  views/        可嵌入主界面底部导航的功能视图
  pages/        小程序页面
test/           核心逻辑单元测试
```

## 端到端测试（H5 + 模拟服务器）

`e2e/` 提供一个模拟 ThingsBoard PE REST 接口的 Node 服务和 Playwright 脚本，覆盖登录（含错误密码、2FA）、
主导航、告警（确认/评论/筛选）、设备（统计/筛选/详情/仪表板 URL）、客户、审计日志、通知、个人资料、登出与会话恢复：

```bash
node e2e/mock-server.js &                                   # 端口 9090
TB_API_ENDPOINT=http://127.0.0.1:9090 npm run build:h5
(cd dist/h5 && python3 -m http.server 8080) &
node e2e/run.js /tmp/shots                                  # 需要已安装 playwright
```

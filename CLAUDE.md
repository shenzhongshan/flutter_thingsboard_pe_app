# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Layout

- `lib/`: the ThingsBoard PE Flutter mobile app (upstream `thingsboard/flutter_thingsboard_pe_app`).
- `taro_thingsboard_app/`: a WeChat mini program port of the mobile app built with JD Taro 4 (React + TypeScript). It also builds for H5, Alipay and Douyin. See `taro_thingsboard_app/README.md` for the feature map and the limitations compared with Flutter.

## Related Repositories

- `shenzhongshan/thingsboard`: unmodified ThingsBoard CE, used as a reference only.
- `shenzhongshan/thingsboard-pe2ce`: CE 4.4 with most PE features ported (branch `mydev-pe`). This is the server the mini program targets. Its mobile center supports the `WECHAT_MINIPROGRAM` platform.

## Mini Program Commands

```bash
cd taro_thingsboard_app
npm install
npm run build:weapp          # dist/weapp, open taro_thingsboard_app/ in WeChat DevTools
npm run build:h5             # dist/h5
npm test                     # core logic unit tests (tsc to .test-build, node --test)
npx tsc --noEmit -p .        # type check
```

- **Build parameters**:
  - `TB_API_ENDPOINT`: fixed server address; hides region selection.
  - `TB_MOBILE_PKG_NAME`: override of the package name; default is the AppID read at runtime.
  - `TB_MOBILE_PLATFORM`: default is `WECHAT_MINIPROGRAM`.
  - `TB_APP_VERSION`: version for develop/trial builds.
- **End-to-end test**: run `e2e/mock-server.js` (a mock ThingsBoard REST API on port 9090), then `npm run build:h5` with `TB_API_ENDPOINT=http://127.0.0.1:9090`, serve `dist/h5` on port 8080, and run `node e2e/run.js <screenshot dir>` (Playwright).

## Mini Program Architecture

- `src/api/`: REST calls. `http.ts` handles the `X-Authorization` token, refresh on 401 and error toasts. `silent` requests do not show a toast.
- `src/core/`: pure logic, unit-tested in `test/logic.test.ts`:
  - `navigation.ts`: mobile layout to bottom bar / More menu, with PE RBAC filtering.
  - `permissions.ts`: generic permissions, `readGroupPermissions` and the `groupPermissions` fallback.
  - `version.ts`, `dashboard.ts`, `alarm.ts`.
- `src/store/`: small `useSyncExternalStore` stores (auth, version, alarm filters, live tracking).
- `src/views/`: views embedded in the main page's dynamic bottom bar. `src/pages/`: mini program pages.
- **Mobile center lookup** (`api/auth.ts`): queries `pkgName=<own AppID>&platform=WECHAT_MINIPROGRAM`. On HTTP 400 (stock ThingsBoard) it falls back to `ANDROID` with `org.thingsboard.pe.miniprogram`.
- **Tenant isolation**: a 403 from `/api/mobile` means the mini program belongs to another tenant. `store/auth.ts` throws `TenantMismatchError`, logs out and tells the user.
- **Version check** (`store/version.ts`, `pages/update`): below `minVersion` the app goes to a blocking update page that uses WeChat `UpdateManager`; below `latestVersion` it prompts once per version.
- **Dashboards**: open in `<web-view>` at `/dashboard/{id}?accessToken=…&refreshToken=…`. This needs a business domain configured on the WeChat platform.

## Server Quirks Seen on Real Servers

- **Device `active` key**: when `/api/system/params` has `persistDeviceStateToTelemetry=true`, `active` is a TIME_SERIES key, not an attribute. `api/entities.ts` switches the key type accordingly.
- **Permission fields**: some servers return only `userPermissions.groupPermissions`, without `readGroupPermissions`.

## Deployment Model

Each tenant registers its own mini program (enterprise subject), adds the ThingsBoard domain to the WeChat request and business domains, and registers the AppID in its own mobile center (platform WeChat mini program, plus a bundle). It then builds the same code with `TB_API_ENDPOINT` and uploads it under its own AppID. No per-tenant code changes are needed.

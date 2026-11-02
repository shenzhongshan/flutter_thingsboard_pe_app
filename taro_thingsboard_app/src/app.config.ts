export default defineAppConfig({
  pages: [
    'pages/main/index',
    'pages/login/index',
    'pages/region/index',
    'pages/two-factor/index',
    'pages/reset-password/index',
    'pages/section/index',
    'pages/alarm-detail/index',
    'pages/alarm-filter/index',
    'pages/device-detail/index',
    'pages/entity-detail/index',
    'pages/dashboard/index',
    'pages/webview/index',
    'pages/profile/index',
    'pages/change-password/index',
    'pages/live-tracking/index',
    'pages/update/index'
  ],
  window: {
    backgroundTextStyle: 'dark',
    navigationBarBackgroundColor: '#305680',
    navigationBarTitleText: 'ThingsBoard',
    navigationBarTextStyle: 'white',
    backgroundColor: '#f5f6f8'
  },
  // 实时位置追踪需要的定位权限声明
  permission: {
    'scope.userLocation': {
      desc: '用于实时位置追踪，将您的位置上报到 ThingsBoard 中选定的设备'
    }
  },
  requiredPrivateInfos: ['getLocation', 'onLocationChange', 'startLocationUpdate'],
  lazyCodeLoading: 'requiredComponents'
})

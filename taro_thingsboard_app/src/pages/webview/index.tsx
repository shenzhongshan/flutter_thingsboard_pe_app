import { WebView } from '@tarojs/components'
import Taro, { useRouter } from '@tarojs/taro'
import { useEffect } from 'react'
import { session } from '../../api/http'
import { base64Decode } from '../../utils/base64'
import { readParam } from '../../utils/url'

/** 外部链接页，对应 Flutter 版 lib/modules/url/url_page.dart。 */
export default function WebviewPage() {
  const { params } = useRouter()
  let url = params.u ? base64Decode(readParam(params.u)) : ''
  if (url.startsWith('/')) url = `${session.getEndpoint()}${url}`

  useEffect(() => {
    const title = readParam(params.title)
    if (title) Taro.setNavigationBarTitle({ title })
  }, [params.title])

  return <WebView src={url} />
}

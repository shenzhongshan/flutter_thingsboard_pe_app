/** 页面间传递较大对象（URL 参数放不下时使用），读取后即删除。 */
const bag = new Map<string, unknown>()

export function putTransient(key: string, value: unknown) {
  bag.set(key, value)
}

export function peekTransient<T>(key: string): T | undefined {
  return bag.get(key) as T | undefined
}

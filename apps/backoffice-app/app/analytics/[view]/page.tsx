import {ANALYTICS_VIEWS} from '@/src/components/analytics/views'
import {Array, Option} from 'effect'
import {notFound} from 'next/navigation'

export default async function AnalyticsViewPage({
  params,
}: {
  params: Promise<{view: string}>
}) {
  const {view} = await params
  const found = Array.findFirst(ANALYTICS_VIEWS, (item) => item.slug === view)
  if (Option.isNone(found)) notFound()
  const {View} = found.value
  return <View />
}

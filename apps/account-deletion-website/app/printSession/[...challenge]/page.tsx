import PrintSessionForm from './PrintSessionForm'

function normalizeRouteParam(value: string | string[]): string {
  return Array.isArray(value) ? value.join('/') : value
}

export default async function PrintSessionPage({
  params,
}: {
  params: Promise<{challenge: string | string[]}>
}) {
  const {challenge} = await params

  return <PrintSessionForm challenge={normalizeRouteParam(challenge)} />
}

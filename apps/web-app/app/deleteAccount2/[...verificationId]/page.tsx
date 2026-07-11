import DeleteAccount2Form from './DeleteAccount2Form'

function normalizeRouteParam(value: string | string[]): string {
  const routeParam = Array.isArray(value) ? value.join('/') : value

  return decodeURIComponent(routeParam)
}

export default async function DeleteAccount2Page({
  params,
}: {
  params: Promise<{verificationId: string | string[]}>
}) {
  const {verificationId} = await params

  return (
    <div>
      <DeleteAccount2Form
        verificationId={normalizeRouteParam(verificationId)}
      />
    </div>
  )
}

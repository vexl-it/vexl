import DeleteAccount2Form from './DeleteAccount2Form'

function normalizeRouteParam(value: string | string[]): string {
  return Array.isArray(value) ? value.join('/') : value
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

import {NextResponse} from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: process.env.SERVICE_NAME ?? 'Backoffice App',
      version: process.env.SERVICE_VERSION ?? 'unknown',
    },
    {status: 200}
  )
}

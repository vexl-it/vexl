import {authenticate, internalServerError, jsonOk} from '@/src/server/http'
import {NextResponse, type NextRequest} from 'next/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const role = await authenticate(request)
    if (role instanceof NextResponse) return role

    return jsonOk({role})
  } catch (error) {
    return internalServerError(error)
  }
}

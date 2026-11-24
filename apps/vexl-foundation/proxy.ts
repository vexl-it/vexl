import {withSecurityHeaders} from '@vexl-next/website-utils/src/securityHeaders'
import {type NextRequest, NextResponse} from 'next/server'

export const proxy = (request: NextRequest): Promise<NextResponse> =>
  withSecurityHeaders(request, {}, (init) => NextResponse.next(init))

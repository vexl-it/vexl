import {fathomSources} from '@vexl-next/website-utils/src/FathomAnalytics'
import {withSecurityHeaders} from '@vexl-next/website-utils/src/securityHeaders'
import {type NextRequest, NextResponse} from 'next/server'

export const proxy = (request: NextRequest): NextResponse =>
  withSecurityHeaders(request, fathomSources, (init) => NextResponse.next(init))

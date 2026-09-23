import {runDb} from '@/src/server/db'
import {internalServerError, reportError} from '@/src/server/http'
import {
  findShortLinkTarget,
  recordShortLinkClick,
} from '@/src/server/shortLinks/repository'
import {ShortLinkSlug} from '@/src/services/shortLinks/domain'
import {Option, Schema} from 'effect'
import {after, type NextRequest, NextResponse} from 'next/server'

export const runtime = 'nodejs'

interface RouteContext {
  readonly params: Promise<{
    readonly slug: string
  }>
}

const decodeSlug = Schema.decodeUnknownOption(ShortLinkSlug)

const linkNotFound = (): NextResponse =>
  new NextResponse('Link not found', {status: 404})

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const slug = decodeSlug((await context.params).slug.toLowerCase())
    if (Option.isNone(slug)) return linkNotFound()

    const targetUrl = await runDb(findShortLinkTarget(slug.value))
    if (!targetUrl) return linkNotFound()

    after(() => runDb(recordShortLinkClick(slug.value)).catch(reportError))

    // Temporary redirect so browsers keep asking us and edits take effect.
    return NextResponse.redirect(targetUrl, {
      status: 302,
      headers: {'cache-control': 'no-store'},
    })
  } catch (error) {
    return internalServerError(error)
  }
}

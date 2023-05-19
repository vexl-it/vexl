import {type Context, type Next} from 'koa'
import {
  HEADER_CRYPTO_VERSION,
  HEADER_HASH,
  HEADER_PUBLIC_KEY,
  HEADER_SIGNATURE,
} from '@vexl-next/rest-api/dist/constants'

export async function authMiddleware(
  context: Context,
  next: Next
): Promise<void> {
  const publicKey = context.get('HEADER_PUBLIC_KEY')
  const hash = HEADER_HASH
  const signature = HEADER_SIGNATURE
  const cryptoVersion = HEADER_CRYPTO_VERSION

  if (cryptoVersion === '1') {
    context.body = 'TODO'
    context.status = 500
    return
  }

  await next()
}

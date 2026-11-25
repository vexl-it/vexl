import {Predicate} from 'effect'
import {readFileSync, writeFileSync} from 'node:fs'
import {resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {parseArgs} from 'node:util'
import {
  isAnalyticsRelaysSignatureValid,
  signAnalyticsRelays,
} from '../operations/analyticsRelaysSignature'

const relaysPath = fileURLToPath(
  new URL('../../../../analytics-relays.json', import.meta.url)
)

const {values} = parseArgs({
  options: {
    'private-key-path': {type: 'string'},
    'key-id': {type: 'string', default: 'main'},
  },
})
const privateKeyPath = values['private-key-path']
if (!privateKeyPath)
  throw new Error(
    'Usage: sign:analytics-relays --private-key-path <path> [--key-id main]'
  )

const file: unknown = JSON.parse(readFileSync(relaysPath, 'utf8'))
if (!Predicate.isRecord(file))
  throw new Error('analytics-relays.json is not an object')

const signed = signAnalyticsRelays({
  file,
  keyId: values['key-id'],
  // pnpm runs the script in the package directory; INIT_CWD is where it was called from.
  privateKeyPem: readFileSync(
    resolve(process.env.INIT_CWD ?? '.', privateKeyPath),
    'utf8'
  ),
})
if (!isAnalyticsRelaysSignatureValid(signed))
  throw new Error(
    `This private key does not match the "${values['key-id']}" key the app trusts (ANALYTICS_RELAYS_PUBLIC_KEYS). Nothing was written.`
  )

writeFileSync(relaysPath, `${JSON.stringify(signed, null, 2)}\n`)
console.log(`Signed analytics-relays.json with key "${values['key-id']}".`)

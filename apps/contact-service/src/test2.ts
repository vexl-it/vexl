// oprf-demo.ts
// Demonstration of an OPRF-style flow over Ristretto255 using @noble/curves.
// This runs client+server logic locally (no network) to show the "inputs that
// would be sent to the server" and the derived tokens you can store in Postgres.

import {
  ed25519,
  ristretto255,
  ristretto255_hasher,
} from '@noble/curves/ed25519.js'
import {sha256} from '@noble/hashes/sha2.js'

const RPoint = ristretto255.Point

// -------------------- Types --------------------

type Bytes = Uint8Array
type Hex = string
type Scalar = bigint // modulo L (the subgroup order)

// A single contact input on the client
interface ContactInput {
  e164: string
}

// What the client sends to the server for each input
interface BlindedPayload {
  input: ContactInput // for local bookkeeping; not sent to server
  r: Scalar // blinding scalar (kept client-side only)
  X: RPoint // H2C(x) (kept client-side only; helpful for debugging)
  X_blinded: RPoint // r * X (this is sent to the server)
}

// The server's response for each blinded point
interface EvaluatedBlinded {
  Y_blinded: RPoint // k * (r * X)
}

// The final match token the client derives and can store
interface TokenRecord {
  input: ContactInput
  token: Bytes // 32 bytes (store as BYTEA in Postgres)
  tokenHex: Hex // display/debug
  // Optional debugging fields:
  evaluatedPoint: Bytes // encoded k * X (not needed in production)
}

type RPoint = InstanceType<typeof ristretto255.Point>

// -------------------- Shortcuts --------------------

const RistrettoPoint = ristretto255.Point
const {utils} = ed25519 // CURVE.l is the subgroup order
const CURVE = ed25519.Point.CURVE()

const utf8 = (s: string): Bytes => new TextEncoder().encode(s)
const toHex = (u8: Bytes): Hex => Buffer.from(u8).toString('hex')

// -------------------- Math & Helpers --------------------

// Convert a little-endian 32-byte private key to bigint
function le32ToBigIntLE(b: Bytes): bigint {
  // Buffer->hex reverses for LE representation (we treat b as LE)
  let res = 0n
  for (let i = b.length - 1; i >= 0; i--) {
    res = (res << 8n) + BigInt(b[i])
  }
  return res
}

// Generate a random scalar r in [1..L-1]
function randomScalar(): Scalar {
  const sk = utils.randomSecretKey() // 32 bytes, reduced mod L internally
  // noble's private key is LE for ed25519 usage; convert to bigint
  const r = le32ToBigIntLE(sk) % CURVE.n
  return r === 0n ? 1n : r
}

// Fast exponentiation mod m (for inverse via m-2, since L is prime)
function modPow(base: bigint, exp: bigint, m: bigint): bigint {
  let result = 1n
  let b = base % m
  let e = exp
  while (e > 0n) {
    if (e & 1n) result = (result * b) % m
    b = (b * b) % m
    e >>= 1n
  }
  return result
}

function modInv(a: bigint, m: bigint = CURVE.n): bigint {
  if (a === 0n) throw new Error('Inverse of zero')
  return modPow(a, m - 2n, m)
}

// Domain-separated hash for final token (prevents cross-protocol misuse)
function tokenHash(pointBytes: Bytes, label: string): Bytes {
  const preimage = new Uint8Array([
    ...utf8('OPRF-DEMO|'),
    ...utf8(label),
    0x00,
    ...pointBytes,
  ])
  return sha256(preimage)
}

// Hash arbitrary input (e.g., phone number) to a Ristretto point
function hashToPoint(input: string, label = 'ristretto255-oprf'): RPoint {
  const msg = new Uint8Array([...utf8(label), 0x00, ...utf8(input)])
  return ristretto255_hasher.hashToCurve(msg) // returns a Ristretto point
}

// -------------------- OPRF Core --------------------

// Server secret OPRF key (demo only; store in HSM/TEE in production)
// const k: Scalar = randomScalar()
const k: Scalar = BigInt(
  '259849860507384805416742979445246880882676499929365477965052796078411627666'
)

// CLIENT: blind inputs
function clientBlind(inputs: ContactInput[]): BlindedPayload[] {
  // For each x:
  //   X = H2C(x)
  //   r = random scalar
  //   X_blinded = r * X
  return inputs.map((inp) => {
    const X = hashToPoint(inp.e164)
    const r = randomScalar()
    const X_blinded = X.multiply(r)
    return {input: inp, r, X, X_blinded}
  })
}

// SERVER: evaluate on blinded points
function serverEvaluate(blinded: BlindedPayload[]): EvaluatedBlinded[] {
  // For each X_blinded, Y_blinded = k * X_blinded
  return blinded.map(({X_blinded}) => ({
    Y_blinded: X_blinded.multiply(k),
  }))
}

// CLIENT: unblind and derive final tokens
function clientUnblindAndToken(
  blinded: BlindedPayload[],
  evaluated: EvaluatedBlinded[],
  label: 'contact' | 'self' | string = 'contact'
): TokenRecord[] {
  if (blinded.length !== evaluated.length) {
    throw new Error('Length mismatch between blinded and evaluated arrays')
  }

  return blinded.map((b, i) => {
    const {r, input} = b
    const {Y_blinded} = evaluated[i]
    const rInv = modInv(r, CURVE.n)
    const Y = Y_blinded.multiply(rInv) // Y = k * X
    const Ybytes = Y.toBytes() // canonical Ristretto encoding (32 bytes)
    const token = tokenHash(Ybytes, label)
    return {
      input,
      token,
      tokenHex: toHex(token),
      evaluatedPoint: Ybytes, // for debugging/inspection
    }
  })
}

// -------------------- Demo Runner --------------------

async function main(): Promise<void> {
  console.log('--- OPRF demo (TypeScript / single-process) ---')

  const contacts: ContactInput[] = [
    {e164: '+14155550123'},
    {e164: '+447700900123'},
    {e164: '+420731000111'},
  ]

  // CLIENT → blind
  const blinded = clientBlind(contacts)

  // What would be sent to the server:
  console.log('\nClient → Server (blinded points):')
  blinded.forEach((b, i) => {
    console.log(
      `  [${i}] ${contacts[i].e164}  ->  X_blinded = ${toHex(b.X_blinded.toBytes())}`
    )
  })

  // SERVER → evaluate
  const evaluated = serverEvaluate(blinded)

  console.log('\nServer → Client (evaluated blinded points):')
  evaluated.forEach((e, i) => {
    console.log(`  [${i}] Y_blinded = ${toHex(e.Y_blinded.toBytes())}`)
  })

  // CLIENT → unblind & derive tokens (store these in Postgres)
  const tokens = clientUnblindAndToken(blinded, evaluated, 'contact')

  console.log('\nClient (final tokens for Postgres):')
  tokens.forEach((t, i) => {
    console.log(`  [${i}] ${t.input.e164}  ->  token = ${t.tokenHex}`)
  })

  // Example of a "self" token for a registered user (domain-separated)
  const myNumber = '+420777888999'
  const myX = hashToPoint(myNumber)
  const myY = myX.multiply(k) // server-side logically
  const selfToken = tokenHash(myY.toBytes(), 'self')
  console.log(`\nSelf token for ${myNumber}: ${toHex(selfToken)}`)

  // Debug: never log secrets in production
  // (k is the server's OPRF key; shown only for this self-contained demo)
  console.log('\n[debug] Server secret k (bigint):', k.toString())
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

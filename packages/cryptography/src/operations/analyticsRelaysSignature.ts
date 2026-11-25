import {Array, Option, Order, pipe, Predicate, Record, Schema} from 'effect'
import {rsaSha256Sign, rsaSha256Verify} from './rsa'

/**
 * `analytics-relays.json` is signed with the key that signs over-the-air
 * updates, so these are the public keys of the certificates in
 * `apps/mobile/certs`, by `keyid`. Shipped apps check the file against their
 * own copy forever: after a certificate rotation add the new key here and keep
 * signing with the old one too.
 */
export const ANALYTICS_RELAYS_PUBLIC_KEYS: Readonly<Record<string, string>> = {
  main: `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAzlHehGfEI2FzoBStEtl5
5wIfvs+a5jplJ370qVhMku9RO4alroP51et8TVDorV+baIrz6Rwc2YXqVfZHTreT
ufzpvf5o7958Mn5mcfcfcjsABH79sJLDqG5ibZJkzQebIo2W1B68cuGfGtZEP/IQ
OZVQs14mdIT9+JTdpPPTISALWVSjrIEFqJN5oD6U5O+/jcDiK134Us23sJpbKdjP
5XMIY53Sbk99yOZja3Prs1frbCf5dtqkm3HZB0Ptwc2gkbIcLI2IsP3/jICdkwXq
gaGeMIEAmy1j73PzKsPPVZKpzlR3P3VHbAGi6r1CbSHi1x91Wqg75MSaf/MmwyYO
KwIDAQAB
-----END PUBLIC KEY-----
`,
}

/** Keeps a relays signature from ever passing as an update manifest signature made with the same key. */
const SIGNATURE_CONTEXT = 'vexl-analytics-relays'

const Signed = Schema.Struct({
  signatures: Schema.Record({key: Schema.String, value: Schema.String}),
})

const byKey = Order.mapInput(
  Order.string,
  ([key]: readonly [string, unknown]) => key
)

/** The same data always gives the same string: object keys sorted, no whitespace. */
export const canonicalJson = (data: unknown): string =>
  JSON.stringify(data, (_, value: unknown) =>
    Predicate.isRecord(value)
      ? pipe(Record.toEntries(value), Array.sort(byKey), Record.fromEntries)
      : value
  )

const signedMessage = (file: Readonly<Record<string, unknown>>): string =>
  `${SIGNATURE_CONTEXT}\n${canonicalJson(Record.remove(file, 'signatures'))}`

const signaturesOf = (file: unknown): Readonly<Record<string, string>> =>
  pipe(
    Schema.decodeUnknownOption(Signed)(file),
    Option.match({onNone: () => ({}), onSome: (signed) => signed.signatures})
  )

/** Adds the signature under `keyId` and keeps the signatures made with other keys. */
export const signAnalyticsRelays = ({
  file,
  keyId,
  privateKeyPem,
}: {
  file: Readonly<Record<string, unknown>>
  keyId: string
  privateKeyPem: string
}): Readonly<Record<string, unknown>> => ({
  ...file,
  signatures: {
    ...signaturesOf(file),
    [keyId]: rsaSha256Sign({message: signedMessage(file), privateKeyPem}),
  },
})

/** True when one of `publicKeys` signed every field of `file` except `signatures`. */
export const isAnalyticsRelaysSignatureValid = (
  file: unknown,
  publicKeys = ANALYTICS_RELAYS_PUBLIC_KEYS
): boolean => {
  if (!Predicate.isRecord(file)) return false

  const message = signedMessage(file)
  const signatures = signaturesOf(file)
  return pipe(
    Record.toEntries(publicKeys),
    Array.some(([keyId, publicKeyPem]) =>
      pipe(
        Record.get(signatures, keyId),
        Option.flatMap((signature) =>
          Option.liftThrowable(rsaSha256Verify)({
            message,
            signature,
            publicKeyPem,
          })
        ),
        Option.getOrElse(() => false)
      )
    )
  )
}

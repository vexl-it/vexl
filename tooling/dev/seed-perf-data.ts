/**
 * seed-perf-data.ts — seeds the LOCALLY RUNNING vexl backend with fake users
 * that simulate "other people on the network" around one real (emulator) user,
 * so the app can be tested against a realistically heavy account.
 *
 * The fake users authenticate with headers signed by the committed dev server
 * key from dev.config.ts (same trick as backend unit tests) — no OTP flow is
 * needed. Phone-number hashes use the dev HMAC key 'VexlVexl' which matches
 * the mobile `local` preset, so hashes line up with what the app computes.
 *
 * PHASES (must run in this order, interleaved with in-app steps):
 *
 *   1. `--phase register`
 *      Creates N_USERS fake users on contact-service and imports contacts:
 *      every "direct" fake user imports TARGET_PHONE + a few fake neighbours,
 *      "indirect" fake users import only direct fake users (=> they end up as
 *      the target's 2nd-degree connections). Writes key material to
 *      seed-users.json and the phone list to seed-fake-numbers.json.
 *
 *   2. IN APP: log the emulator user in with TARGET_PHONE (dummy OTP 222222 on
 *      local backend) and make the app import the fake numbers (the
 *      `numbersToImportInApp` array of seed-fake-numbers.json — e.g. via the
 *      DebugScreen test contacts or by seeding device contacts). The target
 *      must be REGISTERED (onboarded) before phase `offers`, otherwise the
 *      fake users' offers cannot be encrypted for them.
 *
 *   3. `--phase offers`
 *      Every fake user creates OFFERS_PER_USER offers (connection level ALL),
 *      encrypted for all their 1st+2nd degree connections — which includes the
 *      target. Each offer gets its own inbox on chat-service.
 *
 *   4. IN APP: the target creates at least one own offer.
 *
 *   5. `--phase chats`
 *      N_CHATS fake users fetch offers visible to them, find the target's own
 *      offers (any offer not created by this script), and send messaging
 *      requests to those offer inboxes.
 *
 *   6. IN APP: approve the incoming requests (chat requests screen).
 *
 *   7. `--phase messages`
 *      Each fake user with an (approved) chat sends MSGS_PER_CHAT messages to
 *      the target's offer inbox. Requires the in-app approval from step 6 —
 *      unapproved chats are reported and skipped.
 *
 *   `--phase verify` prints connection/offer counts for a few fake users.
 *
 * USAGE (from repo root, backend running via `pnpm dev:backend`):
 *
 *   TARGET_PHONE=+420605123456 pnpm exec tsx tooling/dev/seed-perf-data.ts --phase register
 *
 * Params via env: TARGET_PHONE (required), N_USERS (300), OFFERS_PER_USER (2),
 * N_CHATS (30), MSGS_PER_CHAT (40), CONCURRENCY (10), SEED_DIR (where the two
 * json files live), CONTACT_MS / OFFER_MS / CHAT_MS url overrides.
 *
 * To wipe everything and start over: restart the backend with a fresh db
 * (`pnpm dev:backend --fresh-db`) and delete the seed json files.
 */
import {FetchHttpClient} from '@effect/platform'
import {
  generatePrivateKey,
  importPrivateKey,
  type PrivateKeyHolder,
} from '@vexl-next/cryptography/src/KeyHolder'
import {
  PrivateKeyPemBase64,
  PublicKeyPemBase64,
} from '@vexl-next/cryptography/src/KeyHolder/brands'
import {
  KeyPairV2,
  PrivateKeyV2,
} from '@vexl-next/cryptography/src/KeyHolder/brandsV2'
import {generateKeyPair} from '@vexl-next/cryptography/src/operations/cryptobox'
import {CountryPrefix} from '@vexl-next/domain/src/general/CountryPrefix.brand'
import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {
  generateChatMessageId,
  type ChatMessage,
} from '@vexl-next/domain/src/general/messaging'
import {
  newOfferId,
  OfferAdminId,
  OfferId,
  OfferPublicPart,
} from '@vexl-next/domain/src/general/offers'
import {Base64String} from '@vexl-next/domain/src/utility/Base64String.brand'
import {PlatformName} from '@vexl-next/domain/src/utility/PlatformName'
import {SemverString} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {now} from '@vexl-next/domain/src/utility/UnixMilliseconds.brand'
import {VersionCode} from '@vexl-next/domain/src/utility/VersionCode.brand'
import {
  cryptoBoxSign,
  ecdsaSignE,
  hmacSignE,
} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {messageToNetwork} from '@vexl-next/resources-utils/src/chat/utils/messageIO'
import {taskEitherToEffect} from '@vexl-next/resources-utils/src/effect-helpers/TaskEitherConverter'
import createNewOfferForMyContacts from '@vexl-next/resources-utils/src/offers/createNewOfferForMyContacts'
import decryptOffer from '@vexl-next/resources-utils/src/offers/decryptOffer'
import {chat, contact, offer} from '@vexl-next/rest-api'
import {AppSource} from '@vexl-next/rest-api/src/commonHeaders'
import fetchAllPaginatedData from '@vexl-next/rest-api/src/fetchAllPaginatedData'
import {type ChatApi} from '@vexl-next/rest-api/src/services/chat'
import {type ContactApi} from '@vexl-next/rest-api/src/services/contact'
import {type OfferApi} from '@vexl-next/rest-api/src/services/offer'
import {type ServerOffer} from '@vexl-next/rest-api/src/services/offer/contracts'
import {ServiceUrl} from '@vexl-next/rest-api/src/ServiceUrl.brand'
import {type UserSessionCredentials} from '@vexl-next/rest-api/src/UserSessionCredentials.brand'
import {UserDataShape} from '@vexl-next/rest-api/src/VexlAuthHeader'
import {Array, Effect, HashMap, Option, pipe, Schema} from 'effect'
import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {devCryptoKeys, ports} from '../../dev.config'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const args = process.argv.slice(2)
const phaseFlagIndex = args.indexOf('--phase')
const PHASE = phaseFlagIndex >= 0 ? args[phaseFlagIndex + 1] : undefined

const N_USERS = Number(process.env.N_USERS ?? 300)
const OFFERS_PER_USER = Number(process.env.OFFERS_PER_USER ?? 2)
const N_CHATS = Number(process.env.N_CHATS ?? 30)
const MSGS_PER_CHAT = Number(process.env.MSGS_PER_CHAT ?? 40)
const CONCURRENCY = Number(process.env.CONCURRENCY ?? 10)
const SEED_DIR = process.env.SEED_DIR ?? join(tmpdir(), 'vexl-seed-perf-data')

const SEED_USERS_FILE = join(SEED_DIR, 'seed-users.json')
const SEED_NUMBERS_FILE = join(SEED_DIR, 'seed-fake-numbers.json')

const CONTACT_URL = Schema.decodeSync(ServiceUrl)(
  process.env.CONTACT_MS ?? `http://localhost:${ports.contactService}`
)
const OFFER_URL = Schema.decodeSync(ServiceUrl)(
  process.env.OFFER_MS ?? `http://localhost:${ports.offerService}`
)
const CHAT_URL = Schema.decodeSync(ServiceUrl)(
  process.env.CHAT_MS ?? `http://localhost:${ports.chatService}`
)

// ---------------------------------------------------------------------------
// Safety guard: refuse to seed anything but a local backend
// ---------------------------------------------------------------------------

// This script mass-mutates backends (hundreds of fake users, offers, chats).
// Pointing it at a shared/staging/prod service via the *_MS overrides would
// pollute real data, so we hard-fail unless every service host is local.
const REMOTE_OVERRIDE_ENV = 'I_KNOW_WHAT_I_AM_DOING_SEEDING_REMOTE'

const isLocalHost = (host: string): boolean => {
  // URL.hostname keeps IPv6 in brackets, e.g. "[::1]"
  const normalized =
    host.startsWith('[') && host.endsWith(']') ? host.slice(1, -1) : host
  return (
    normalized === 'localhost' ||
    normalized.endsWith('.localhost') ||
    normalized === '127.0.0.1' ||
    normalized === '::1'
  )
}

function assertLocalServiceUrls(): void {
  const services: Array<{name: string; url: ServiceUrl}> = [
    {name: 'CONTACT_MS', url: CONTACT_URL},
    {name: 'OFFER_MS', url: OFFER_URL},
    {name: 'CHAT_MS', url: CHAT_URL},
  ]

  const nonLocal = pipe(
    services,
    Array.filterMap(({name, url}) => {
      let host: string
      try {
        host = new URL(url).hostname
      } catch {
        return Option.some(`${name} (${url}) is not a valid URL`)
      }
      return isLocalHost(host)
        ? Option.none()
        : Option.some(`${name} points at non-local host "${host}" (${url})`)
    })
  )

  if (!Array.isNonEmptyArray(nonLocal)) return

  if (process.env[REMOTE_OVERRIDE_ENV] === '1') {
    console.warn(
      '\n############################################################\n' +
        '# WARNING: seeding a NON-LOCAL backend with fake data!\n' +
        `# ${REMOTE_OVERRIDE_ENV}=1 is set, so the local-only guard\n` +
        '# is bypassed. This will write hundreds of fake users, offers\n' +
        '# and chats to:\n' +
        nonLocal.map((line) => `#   - ${line}`).join('\n') +
        '\n############################################################\n'
    )
    return
  }

  console.error(
    'Refusing to run: seed-perf-data.ts may only target a LOCAL backend.\n' +
      nonLocal.map((line) => `  - ${line}`).join('\n') +
      '\n\nThis script mass-creates fake users/offers/chats and must never touch\n' +
      'shared/staging/prod services. Point CONTACT_MS/OFFER_MS/CHAT_MS at\n' +
      'localhost, or (only if you truly mean it) re-run with ' +
      `${REMOTE_OVERRIDE_ENV}=1.`
  )
  process.exit(1)
}

const CLIENT_SEMVER = Schema.decodeSync(SemverString)('1.44.0')
const CLIENT_VERSION = Schema.decodeSync(VersionCode)(841)
const PLATFORM = Schema.decodeSync(PlatformName)('ANDROID')
const APP_SOURCE = Schema.decodeSync(AppSource)('seed-script')
const COUNTRY_PREFIX = Schema.decodeSync(CountryPrefix)(420)

const DEV_SERVER_PRIVATE_KEY = Schema.decodeSync(PrivateKeyPemBase64)(
  devCryptoKeys.SECRET_PRIVATE_KEY
)
const DEV_LIBSODIUM_PRIVATE_KEY = Schema.decodeSync(PrivateKeyV2)(
  devCryptoKeys.LIBSODIUM_PRIVATE_KEY
)

// How many fake neighbours each fake user imports (creates the 2nd degree web)
const NEIGHBOURS_PER_USER = 6
// Portion of fake users the target should import directly (1st degree)
const DIRECT_RATIO = 2 / 3

// ---------------------------------------------------------------------------
// Seed file persistence
// ---------------------------------------------------------------------------

const SeedUser = Schema.Struct({
  index: Schema.Number,
  phone: E164PhoneNumber,
  direct: Schema.Boolean,
  privateKeyPemBase64: PrivateKeyPemBase64,
  keyPairV2: KeyPairV2,
})
type SeedUser = typeof SeedUser.Type

const SeedOffer = Schema.Struct({
  offerId: OfferId,
  adminId: OfferAdminId,
  creatorIndex: Schema.Number,
  offerKeyPrivatePemBase64: PrivateKeyPemBase64,
})
type SeedOffer = typeof SeedOffer.Type

const SeedChat = Schema.Struct({
  userIndex: Schema.Number,
  offerId: OfferId,
  offerPublicKey: PublicKeyPemBase64,
  requestedAt: Schema.Number,
  messagesSent: Schema.optionalWith(Schema.Number, {default: () => 0}),
})
type SeedChat = typeof SeedChat.Type

const SeedFile = Schema.Struct({
  targetPhone: E164PhoneNumber,
  users: Schema.Array(SeedUser),
  offers: Schema.Array(SeedOffer),
  chats: Schema.Array(SeedChat),
})
type SeedFile = typeof SeedFile.Type

interface MutableSeedChat {
  userIndex: number
  offerId: OfferId
  offerPublicKey: PublicKeyPemBase64
  requestedAt: number
  messagesSent: number
}

interface SeedState {
  targetPhone: E164PhoneNumber
  users: SeedUser[]
  offers: SeedOffer[]
  chats: MutableSeedChat[]
}

function loadSeedState(): SeedState | undefined {
  if (!existsSync(SEED_USERS_FILE)) return undefined
  const raw = readFileSync(SEED_USERS_FILE, 'utf8')
  const decoded = Schema.decodeUnknownSync(Schema.parseJson(SeedFile))(raw)
  return {
    targetPhone: decoded.targetPhone,
    users: [...decoded.users],
    offers: [...decoded.offers],
    chats: decoded.chats.map((c) => ({...c})),
  }
}

function saveSeedState(state: SeedState): void {
  mkdirSync(SEED_DIR, {recursive: true})
  const encoded = Schema.encodeSync(SeedFile)({
    targetPhone: state.targetPhone,
    users: state.users,
    offers: state.offers,
    chats: state.chats,
  })
  writeFileSync(SEED_USERS_FILE, JSON.stringify(encoded, null, 2))
}

// ---------------------------------------------------------------------------
// Auth + api helpers
// ---------------------------------------------------------------------------

const hashPhoneNumber = (
  phone: E164PhoneNumber
): Effect.Effect<HashedPhoneNumber, unknown> =>
  hmacSignE(devCryptoKeys.SECRET_HMAC_KEY)(phone).pipe(
    Effect.map(Schema.decodeSync(HashedPhoneNumber))
  )

/**
 * Builds session credentials exactly like the backend would issue them:
 * - hash: HMAC of the phone number with the dev HMAC key
 * - signature: ECDSA of `${publicKey}${hash}` with the dev server key
 * - vexlAuthHeader: `VexlAuth` header carrying the user's V2 (cryptobox)
 *   public key, signed with the dev libsodium server key. This makes the
 *   services treat the fake user as a modern V2 user (needed e.g. for the
 *   offer owner private part check).
 */
const makeCredentials = (
  phone: E164PhoneNumber,
  keyPair: PrivateKeyHolder,
  keyPairV2: KeyPairV2
): Effect.Effect<UserSessionCredentials, unknown> =>
  Effect.gen(function* (_) {
    const hash = yield* _(hashPhoneNumber(phone))
    const signature = yield* _(
      ecdsaSignE(DEV_SERVER_PRIVATE_KEY)(`${keyPair.publicKeyPemBase64}${hash}`)
    )
    const userData = {pk: keyPairV2.publicKey, hash}
    const userDataEncoded = yield* _(Schema.encode(UserDataShape)(userData))
    const vexlAuthSignature = yield* _(
      cryptoBoxSign(DEV_LIBSODIUM_PRIVATE_KEY)(userDataEncoded)
    )
    return {
      publicKey: keyPair.publicKeyPemBase64,
      hash,
      signature,
      vexlAuthHeader: {data: userData, signature: vexlAuthSignature},
    }
  })

interface Apis {
  contact: ContactApi
  offer: OfferApi
  chat: ChatApi
}

function makeApis(credentials: UserSessionCredentials): Apis {
  const common = {
    platform: PLATFORM,
    clientVersion: CLIENT_VERSION,
    clientSemver: CLIENT_SEMVER,
    language: 'en',
    isDeveloper: false,
    appSource: APP_SOURCE,
    getUserSessionCredentials: () => credentials,
  }
  return Effect.gen(function* (_) {
    return {
      contact: yield* _(contact.api({...common, url: CONTACT_URL})),
      offer: yield* _(offer.api({...common, url: OFFER_URL})),
      chat: yield* _(chat.api({...common, url: CHAT_URL})),
    }
  }).pipe(Effect.provide(FetchHttpClient.layer), Effect.runSync)
}

const userKeyPair = (user: SeedUser): PrivateKeyHolder =>
  importPrivateKey({privateKeyPemBase64: user.privateKeyPemBase64})

const apisForUser = (
  user: SeedUser
): Effect.Effect<{apis: Apis; keyPair: PrivateKeyHolder}, unknown> =>
  Effect.gen(function* (_) {
    const keyPair = userKeyPair(user)
    const credentials = yield* _(
      makeCredentials(user.phone, keyPair, user.keyPairV2)
    )
    return {apis: makeApis(credentials), keyPair}
  })

// ---------------------------------------------------------------------------
// Progress logging
// ---------------------------------------------------------------------------

function makeProgressLogger(total: number, label: string): () => void {
  let done = 0
  return () => {
    done += 1
    if (done % 50 === 0 || done === total) {
      console.log(`[${label}] ${done}/${total}`)
    }
  }
}

// ---------------------------------------------------------------------------
// Phase: register
// ---------------------------------------------------------------------------

const fakePhoneForIndex = (i: number): E164PhoneNumber =>
  Schema.decodeSync(E164PhoneNumber)(`+${420777000000 + i}`)

async function generateSeedUsers(
  targetPhone: E164PhoneNumber
): Promise<SeedState> {
  const nDirect = Math.max(1, Math.ceil(N_USERS * DIRECT_RATIO))
  const users: SeedUser[] = []
  for (let i = 0; i < N_USERS; i++) {
    const keyPair = generatePrivateKey()
    const keyPairV2 = await generateKeyPair()
    users.push({
      index: i,
      phone: fakePhoneForIndex(i),
      direct: i < nDirect,
      privateKeyPemBase64: keyPair.privateKeyPemBase64,
      keyPairV2,
    })
  }
  return {targetPhone, users, offers: [], chats: []}
}

/**
 * Numbers this fake user imports as their contacts. Direct users import the
 * target + a rolling window of neighbours (both direct and indirect fakes).
 * Indirect users import only direct users — that makes them reachable as the
 * target's 2nd degree without ever being the target's direct contact.
 */
function contactsForUser(user: SeedUser, state: SeedState): E164PhoneNumber[] {
  const nDirect = state.users.filter((u) => u.direct).length
  const phones: E164PhoneNumber[] = []
  if (user.direct) {
    phones.push(state.targetPhone)
    for (let k = 1; k <= NEIGHBOURS_PER_USER; k++) {
      const neighbour = state.users[(user.index + k) % state.users.length]
      if (neighbour !== undefined && neighbour.index !== user.index) {
        phones.push(neighbour.phone)
      }
    }
  } else {
    for (let k = 0; k < NEIGHBOURS_PER_USER; k++) {
      const neighbour = state.users[(user.index * 7 + k) % nDirect]
      if (neighbour !== undefined && neighbour.index !== user.index) {
        phones.push(neighbour.phone)
      }
    }
  }
  return pipe(phones, Array.dedupe)
}

async function phaseRegister(targetPhone: E164PhoneNumber): Promise<void> {
  let state = loadSeedState()
  if (state !== undefined) {
    console.log(
      `Reusing ${state.users.length} users from ${SEED_USERS_FILE} (delete the file to regenerate keys).`
    )
    if (state.targetPhone !== targetPhone) {
      throw new Error(
        `TARGET_PHONE mismatch: seed file has ${state.targetPhone}, got ${targetPhone}. Delete ${SEED_USERS_FILE} to start over.`
      )
    }
  } else {
    console.log(`Generating ${N_USERS} fake users...`)
    state = await generateSeedUsers(targetPhone)
    saveSeedState(state)
  }

  // Write the numbers file for the in-app import step
  mkdirSync(SEED_DIR, {recursive: true})
  writeFileSync(
    SEED_NUMBERS_FILE,
    JSON.stringify(
      {
        targetPhone,
        // The emulator user should import EXACTLY these (the direct users).
        numbersToImportInApp: state.users
          .filter((u) => u.direct)
          .map((u) => u.phone),
        // These must NOT be imported by the emulator user — they become
        // genuine 2nd-degree connections through the direct users.
        secondDegreeOnlyNumbers: state.users
          .filter((u) => !u.direct)
          .map((u) => u.phone),
      },
      null,
      2
    )
  )
  console.log(`Wrote ${SEED_NUMBERS_FILE}`)

  const progress = makeProgressLogger(state.users.length, 'register')
  const stateForClosure = state

  const registerOne = (user: SeedUser): Effect.Effect<void, unknown> =>
    Effect.gen(function* (_) {
      const {apis} = yield* _(apisForUser(user))
      yield* _(
        apis.contact.createUser({
          vexlNotificationToken: Option.none(),
          firebaseToken: null,
          expoToken: null,
          publicKeyV2: Option.none(),
        })
      )
      const contactHashes = yield* _(
        Effect.forEach(contactsForUser(user, stateForClosure), hashPhoneNumber)
      )
      yield* _(
        apis.contact.importContacts({contacts: contactHashes, replace: true})
      )
      progress()
    })

  const results = await Effect.runPromise(
    Effect.forEach(
      state.users,
      (user) =>
        registerOne(user).pipe(
          Effect.either,
          Effect.map((either) => ({user, either}))
        ),
      {concurrency: CONCURRENCY}
    )
  )

  const failures = results.filter((r) => r.either._tag === 'Left')
  for (const failure of failures.slice(0, 5)) {
    console.error(
      `register failed for user ${failure.user.index}:`,
      failure.either._tag === 'Left' ? failure.either.left : undefined
    )
  }
  console.log(
    `register done: ${results.length - failures.length} ok, ${failures.length} failed`
  )
  if (failures.length > 0) process.exitCode = 1
}

// ---------------------------------------------------------------------------
// Phase: offers
// ---------------------------------------------------------------------------

const OFFER_CITIES = [
  {name: 'Prague', latitude: 50.0755, longitude: 14.4378},
  {name: 'Brno', latitude: 49.1951, longitude: 16.6068},
  {name: 'Ostrava', latitude: 49.8209, longitude: 18.2625},
  {name: 'Plzen', latitude: 49.7384, longitude: 13.3736},
  {name: 'Liberec', latitude: 50.7663, longitude: 15.0543},
  {name: 'Olomouc', latitude: 49.5938, longitude: 17.2509},
  {name: 'Vienna', latitude: 48.2082, longitude: 16.3738},
  {name: 'Bratislava', latitude: 48.1486, longitude: 17.1077},
  {name: 'Berlin', latitude: 52.52, longitude: 13.405},
  {name: 'Dresden', latitude: 51.0504, longitude: 13.7373},
]

function buildOfferPublicPart({
  globalIndex,
  offerPublicKey,
}: {
  globalIndex: number
  offerPublicKey: PublicKeyPemBase64
}): OfferPublicPart {
  const city =
    OFFER_CITIES[globalIndex % OFFER_CITIES.length] ?? OFFER_CITIES[0]
  if (city === undefined) throw new Error('No city')
  const jitterLat = (((globalIndex * 13) % 40) - 20) * 0.01
  const jitterLon = (((globalIndex * 7) % 40) - 20) * 0.01
  return Schema.decodeUnknownSync(OfferPublicPart)({
    offerPublicKey,
    location: [
      {
        placeId: `seed-perf-offer-place-${globalIndex}`,
        latitude: city.latitude + jitterLat,
        longitude: city.longitude + jitterLon,
        radius: 0.15,
        address: `${city.name} seed location ${globalIndex}`,
        shortAddress: city.name,
      },
    ],
    offerDescription: `Seed offer #${globalIndex} — ${
      globalIndex % 2 === 0 ? 'selling' : 'buying'
    } sats for cash in ${city.name}. Perf-test data.`,
    amountBottomLimit: 1000 * ((globalIndex % 10) + 1),
    amountTopLimit: 10000 * ((globalIndex % 10) + 5),
    feeState: globalIndex % 3 === 0 ? 'WITH_FEE' : 'WITHOUT_FEE',
    feeAmount: globalIndex % 3 === 0 ? (globalIndex % 5) + 1 : 0,
    locationState: ['IN_PERSON'],
    paymentMethod: globalIndex % 4 === 0 ? ['BANK', 'REVOLUT'] : ['CASH'],
    btcNetwork: globalIndex % 2 === 0 ? ['LIGHTING', 'ON_CHAIN'] : ['ON_CHAIN'],
    currency: globalIndex % 3 === 0 ? 'EUR' : 'CZK',
    spokenLanguages: globalIndex % 2 === 0 ? ['CZE', 'ENG'] : ['ENG'],
    expirationDate: new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString(),
    offerType: globalIndex % 2 === 0 ? 'SELL' : 'BUY',
    activePriceState: 'NONE',
    activePriceValue: 0,
    activePriceCurrency: 'CZK',
    active: true,
    groupUuids: [],
    listingType: 'BITCOIN',
    authorClientVersion: CLIENT_SEMVER,
  })
}

async function phaseOffers(): Promise<void> {
  const state = loadSeedState()
  if (state === undefined) {
    throw new Error(`No ${SEED_USERS_FILE}. Run --phase register first.`)
  }

  const offersByCreator = new Map<number, number>()
  for (const o of state.offers) {
    offersByCreator.set(
      o.creatorIndex,
      (offersByCreator.get(o.creatorIndex) ?? 0) + 1
    )
  }
  const usersToProcess = state.users.filter(
    (u) => (offersByCreator.get(u.index) ?? 0) < OFFERS_PER_USER
  )
  console.log(
    `Creating offers for ${usersToProcess.length}/${state.users.length} users (${OFFERS_PER_USER} each)...`
  )

  const progress = makeProgressLogger(usersToProcess.length, 'offers')
  let processedSinceSave = 0

  const createOffersForUser = (
    user: SeedUser
  ): Effect.Effect<SeedOffer[], unknown> =>
    Effect.gen(function* (_) {
      const {apis, keyPair} = yield* _(apisForUser(user))
      const created: SeedOffer[] = []
      const alreadyHave = offersByCreator.get(user.index) ?? 0
      for (let k = alreadyHave; k < OFFERS_PER_USER; k++) {
        const globalIndex = user.index * OFFERS_PER_USER + k
        const offerKey = generatePrivateKey()

        // Give the offer a real inbox on chat-service, like the app does
        yield* _(apis.chat.createInbox({keyPair: offerKey}))

        const result = yield* _(
          createNewOfferForMyContacts({
            offerApi: apis.offer,
            contactApi: apis.contact,
            publicPart: buildOfferPublicPart({
              globalIndex,
              offerPublicKey: offerKey.publicKeyPemBase64,
            }),
            ownerKeyPair: keyPair,
            ownerKeyPairV2: user.keyPairV2,
            countryPrefix: COUNTRY_PREFIX,
            intendedConnectionLevel: 'ALL',
            intendedClubs: {},
            offerId: newOfferId(),
            serverToClientHashesToHashedPhoneNumbersMap: HashMap.empty(),
          })
        )
        created.push({
          offerId: result.offerInfo.offerId,
          adminId: result.adminId,
          creatorIndex: user.index,
          offerKeyPrivatePemBase64: offerKey.privateKeyPemBase64,
        })
      }
      progress()
      return created
    })

  const results = await Effect.runPromise(
    Effect.forEach(
      usersToProcess,
      (user) =>
        createOffersForUser(user).pipe(
          Effect.either,
          Effect.map((either) => ({user, either})),
          Effect.tap(({either}) =>
            Effect.sync(() => {
              if (either._tag === 'Right') {
                state.offers.push(...either.right)
                processedSinceSave += 1
                if (processedSinceSave >= 20) {
                  processedSinceSave = 0
                  saveSeedState(state)
                }
              }
            })
          )
        ),
      {concurrency: CONCURRENCY}
    )
  )
  saveSeedState(state)

  const failures = results.filter((r) => r.either._tag === 'Left')
  for (const failure of failures.slice(0, 5)) {
    console.error(
      `offers failed for user ${failure.user.index}:`,
      failure.either._tag === 'Left' ? failure.either.left : undefined
    )
  }
  console.log(
    `offers done: ${state.offers.length} offers exist, ${failures.length} users failed`
  )
  if (failures.length > 0) process.exitCode = 1
}

// ---------------------------------------------------------------------------
// Phase: chats (send messaging requests to the target's own offers)
// ---------------------------------------------------------------------------

const REQUEST_TEXTS = [
  'Hi! I would like to trade with you. Cash meetup possible?',
  'Hello, is this offer still active? I am interested.',
  'Hey there, I can do the amount you listed. When are you free?',
  'Hi, long-time vexler here. Interested in your offer.',
  'Ahoj, mel bych zajem o tvou nabidku. Muzeme se domluvit?',
]

const fetchAllOffersForMe = (
  apis: Apis
): Effect.Effect<ServerOffer[], unknown> =>
  fetchAllPaginatedData({
    fetchEffectToRun: (nextPageToken) =>
      apis.offer.getOffersForMeModifiedOrCreatedAfterPaginated({
        limit: 100,
        nextPageToken:
          nextPageToken === undefined
            ? undefined
            : Schema.decodeSync(Base64String)(nextPageToken),
      }),
  })

async function phaseChats(): Promise<void> {
  const state = loadSeedState()
  if (state === undefined) {
    throw new Error(`No ${SEED_USERS_FILE}. Run --phase register first.`)
  }
  const seedOfferIds = new Set<string>(state.offers.map((o) => o.offerId))
  const usersWithChat = new Set(state.chats.map((c) => c.userIndex))
  const senders = state.users
    .filter((u) => u.direct && !usersWithChat.has(u.index))
    .slice(0, Math.max(0, N_CHATS - state.chats.length))

  if (senders.length === 0) {
    console.log(`Nothing to do: ${state.chats.length} chats already recorded.`)
    return
  }
  console.log(
    `Sending ${senders.length} messaging requests to the target's own offers...`
  )

  const progress = makeProgressLogger(senders.length, 'chats')

  const sendRequestForUser = (
    user: SeedUser,
    orderIndex: number
  ): Effect.Effect<SeedChat, unknown> =>
    Effect.gen(function* (_) {
      const {apis, keyPair} = yield* _(apisForUser(user))

      const allOffers = yield* _(fetchAllOffersForMe(apis))
      const candidates = allOffers.filter((o) => !seedOfferIds.has(o.offerId))
      if (candidates.length === 0) {
        return yield* _(
          Effect.fail(
            new Error(
              `Fake user ${user.index} sees no offers created by the target. ` +
                'Did the emulator user import the fake numbers AND create own offers in the app?'
            )
          )
        )
      }

      const decryptedEithers = yield* _(
        Effect.forEach(
          candidates,
          (c) => decryptOffer(keyPair, user.keyPairV2)(c).pipe(Effect.either),
          {concurrency: 5}
        )
      )
      const targetOffers = pipe(
        decryptedEithers,
        Array.filterMap((either) =>
          either._tag === 'Right' ? Option.some(either.right) : Option.none()
        )
      )
      if (!Array.isNonEmptyArray(targetOffers)) {
        return yield* _(
          Effect.fail(
            new Error(
              `Fake user ${user.index} could not decrypt any target offer.`
            )
          )
        )
      }

      const pickedOffer = targetOffers[orderIndex % targetOffers.length]
      if (pickedOffer === undefined) {
        return yield* _(Effect.fail(new Error('No offer picked')))
      }
      const receiverPublicKey = pickedOffer.publicPart.offerPublicKey

      // The sender needs their own inbox for the request handshake
      yield* _(apis.chat.createInbox({keyPair}))

      const requestMessage: ChatMessage = {
        uuid: generateChatMessageId(),
        messageType: 'REQUEST_MESSAGING',
        text:
          REQUEST_TEXTS[user.index % REQUEST_TEXTS.length] ?? REQUEST_TEXTS[0],
        time: now(),
        myVersion: CLIENT_SEMVER,
        senderPublicKey: keyPair.publicKeyPemBase64,
      }
      const cypher = yield* _(
        taskEitherToEffect(messageToNetwork(receiverPublicKey)(requestMessage))
      )
      yield* _(
        apis.chat.requestApprovalV2({
          keyPair,
          receiverPublicKey,
          message: cypher,
        })
      )
      progress()
      return {
        userIndex: user.index,
        offerId: pickedOffer.offerId,
        offerPublicKey: receiverPublicKey,
        requestedAt: Date.now(),
        messagesSent: 0,
      }
    })

  const results = await Effect.runPromise(
    Effect.forEach(
      senders,
      (user, orderIndex) =>
        sendRequestForUser(user, orderIndex).pipe(
          Effect.either,
          Effect.map((either) => ({user, either}))
        ),
      {concurrency: Math.min(CONCURRENCY, 5)}
    )
  )

  for (const result of results) {
    if (result.either._tag === 'Right') state.chats.push(result.either.right)
  }
  saveSeedState(state)

  const failures = results.filter((r) => r.either._tag === 'Left')
  for (const failure of failures.slice(0, 5)) {
    console.error(
      `chat request failed for user ${failure.user.index}:`,
      failure.either._tag === 'Left' ? failure.either.left : undefined
    )
  }
  console.log(
    `chats done: ${state.chats.length} requests recorded, ${failures.length} failed`
  )
  if (failures.length > 0) process.exitCode = 1
}

// ---------------------------------------------------------------------------
// Phase: messages (requires the target to have APPROVED the requests in-app)
// ---------------------------------------------------------------------------

const MESSAGE_TEXTS = [
  'Sounds good. What time works for you?',
  'I can do tomorrow afternoon, around 15:00.',
  'Great — where should we meet?',
  'The usual spot near the main square works for me.',
  'Perfect. What amount are we settling on?',
  'Let me double check the price... deal.',
  'Do you prefer on-chain or lightning?',
  'Lightning is fine for this amount.',
  'Alright, see you there.',
  'By the way, thanks for the smooth communication!',
]

async function phaseMessages(): Promise<void> {
  const state = loadSeedState()
  if (state === undefined) {
    throw new Error(`No ${SEED_USERS_FILE}. Run --phase register first.`)
  }
  const chatsToProcess = state.chats.filter(
    (c) => c.messagesSent < MSGS_PER_CHAT
  )
  if (chatsToProcess.length === 0) {
    console.log('Nothing to do: all recorded chats have their messages.')
    return
  }
  console.log(
    `Sending up to ${MSGS_PER_CHAT} messages for ${chatsToProcess.length} chats...`
  )
  const progress = makeProgressLogger(chatsToProcess.length, 'messages')

  const recordMessageSent = (
    seedChat: MutableSeedChat,
    sentCount: number
  ): void => {
    seedChat.messagesSent = sentCount
  }

  const sendMessagesForChat = (
    seedChat: MutableSeedChat
  ): Effect.Effect<void, unknown> =>
    Effect.gen(function* (_) {
      const user = state.users.find((u) => u.index === seedChat.userIndex)
      if (user === undefined) {
        return yield* _(
          Effect.fail(new Error(`No seed user ${seedChat.userIndex}`))
        )
      }
      const {apis, keyPair} = yield* _(apisForUser(user))

      for (let m = seedChat.messagesSent; m < MSGS_PER_CHAT; m++) {
        const message: ChatMessage = {
          uuid: generateChatMessageId(),
          messageType: 'MESSAGE',
          text: `${MESSAGE_TEXTS[m % MESSAGE_TEXTS.length] ?? '...'} (#${
            m + 1
          })`,
          time: now(),
          myVersion: CLIENT_SEMVER,
          senderPublicKey: keyPair.publicKeyPemBase64,
        }
        const cypher = yield* _(
          taskEitherToEffect(messageToNetwork(seedChat.offerPublicKey)(message))
        )
        yield* _(
          apis.chat.sendMessage({
            keyPair,
            senderPublicKey: keyPair.publicKeyPemBase64,
            receiverPublicKey: seedChat.offerPublicKey,
            message: cypher,
            messageType: 'MESSAGE',
          })
        )
        yield* _(
          Effect.sync(() => {
            recordMessageSent(seedChat, m + 1)
          })
        )
      }
      progress()
    })

  const results = await Effect.runPromise(
    Effect.forEach(
      chatsToProcess,
      (seedChat) =>
        sendMessagesForChat(seedChat).pipe(
          Effect.either,
          Effect.map((either) => ({seedChat, either}))
        ),
      {concurrency: Math.min(CONCURRENCY, 5)}
    )
  )
  saveSeedState(state)

  const failures = results.filter((r) => r.either._tag === 'Left')
  for (const failure of failures.slice(0, 5)) {
    const error =
      failure.either._tag === 'Left' ? failure.either.left : undefined
    const notPermitted =
      typeof error === 'object' &&
      error !== null &&
      '_tag' in error &&
      error._tag === 'NotPermittedToSendMessageToTargetInboxError'
    console.error(
      `messages failed for chat of user ${failure.seedChat.userIndex}` +
        (notPermitted
          ? ' — the request is NOT approved yet. Approve it in the app and re-run --phase messages.'
          : ':'),
      notPermitted ? '' : error
    )
  }
  console.log(
    `messages done: ${results.length - failures.length} chats completed, ${failures.length} failed`
  )
  if (failures.length > 0) process.exitCode = 1
}

// ---------------------------------------------------------------------------
// Phase: verify (read-only sanity check)
// ---------------------------------------------------------------------------

async function phaseVerify(): Promise<void> {
  const state = loadSeedState()
  if (state === undefined) {
    throw new Error(`No ${SEED_USERS_FILE}. Run --phase register first.`)
  }
  const seedOfferIds = new Set<string>(state.offers.map((o) => o.offerId))
  const sampleUsers = pipe(
    [
      state.users[0],
      state.users[Math.floor(state.users.length / 2)],
      state.users[state.users.length - 1],
    ],
    Array.filterMap(Option.fromNullable),
    Array.dedupeWith((a, b) => a.index === b.index)
  )

  const verifyUser = (user: SeedUser): Effect.Effect<void, unknown> =>
    Effect.gen(function* (_) {
      const {apis, keyPair} = yield* _(apisForUser(user))
      const first = yield* _(
        fetchAllPaginatedData({
          fetchEffectToRun: (nextPageToken) =>
            apis.contact.fetchMyContactsPaginated({
              level: 'FIRST',
              limit: 500,
              nextPageToken:
                nextPageToken === undefined
                  ? undefined
                  : Schema.decodeSync(Base64String)(nextPageToken),
            }),
        })
      )
      const second = yield* _(
        fetchAllPaginatedData({
          fetchEffectToRun: (nextPageToken) =>
            apis.contact.fetchMyContactsPaginated({
              level: 'SECOND',
              limit: 500,
              nextPageToken:
                nextPageToken === undefined
                  ? undefined
                  : Schema.decodeSync(Base64String)(nextPageToken),
            }),
        })
      )
      const offersForMe = yield* _(fetchAllOffersForMe(apis))
      const fromTarget = offersForMe.filter((o) => !seedOfferIds.has(o.offerId))
      let decryptedOk = 0
      if (offersForMe.length > 0) {
        const sample = offersForMe.slice(0, 3)
        const decrypted = yield* _(
          Effect.forEach(sample, (o) =>
            decryptOffer(keyPair, user.keyPairV2)(o).pipe(Effect.either)
          )
        )
        decryptedOk = decrypted.filter((d) => d._tag === 'Right').length
      }
      console.log(
        `user ${user.index} (${user.phone}, ${
          user.direct ? 'direct' : 'indirect'
        }): 1st-degree=${first.length}, 2nd-degree=${second.length}, ` +
          `offersForMe=${offersForMe.length} (from target: ${fromTarget.length}), ` +
          `sample decrypt ok=${decryptedOk}`
      )
    })

  for (const user of sampleUsers) {
    const result = await Effect.runPromise(verifyUser(user).pipe(Effect.either))
    if (result._tag === 'Left') {
      console.error(`verify failed for user ${user.index}:`, result.left)
      process.exitCode = 1
    }
  }
  console.log(
    `seed state: ${state.users.length} users, ${state.offers.length} offers, ${state.chats.length} chats`
  )
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  assertLocalServiceUrls()
  const targetPhoneRaw = process.env.TARGET_PHONE
  if (PHASE === undefined) {
    throw new Error(
      'Usage: tsx tooling/dev/seed-perf-data.ts --phase <register|offers|chats|messages|verify>'
    )
  }
  if (PHASE === 'register') {
    if (targetPhoneRaw === undefined) {
      throw new Error('TARGET_PHONE env var is required for --phase register')
    }
    await phaseRegister(Schema.decodeSync(E164PhoneNumber)(targetPhoneRaw))
    return
  }
  if (PHASE === 'offers') {
    await phaseOffers()
    return
  }
  if (PHASE === 'chats') {
    await phaseChats()
    return
  }
  if (PHASE === 'messages') {
    await phaseMessages()
    return
  }
  if (PHASE === 'verify') {
    await phaseVerify()
    return
  }
  throw new Error(`Unknown phase: ${PHASE}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

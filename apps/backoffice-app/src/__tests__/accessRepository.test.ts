import {Array, Effect, Either, Option, pipe} from 'effect'
import {
  type ChallengePurpose,
  consumeChallenge,
  createInvite,
  createSession,
  type Credential,
  deletePasskey,
  deleteSession,
  findCredential,
  findInviteLabel,
  findSessionPasskey,
  isSetupRequired,
  listPasskeys,
  recordPasskeyUse,
  registerFirstPasskey,
  registerInvitedPasskey,
  saveChallenge,
  updatePasskeySections,
} from '../server/access/repository'
import {hashToken} from '../server/access/tokens'
import {runDb} from '../server/db'
import {ALL_SECTIONS, type BackofficeSection} from '../services/access/domain'
import {
  expireRows,
  runSql,
  secondsUntilExpiry,
  setUpTestDatabase,
} from './utils/testDb'

setUpTestDatabase()

const credential = (id: string): Credential => ({
  id,
  publicKey: new Uint8Array([1, 2, 3]),
  counter: 0,
  transports: ['internal'],
})

const registerFirstAdmin = registerFirstPasskey(credential('first'), 'First')

const registerInvited = (
  credentialId: string,
  sections: readonly BackofficeSection[]
) =>
  Effect.flatMap(createInvite('Invited', sections), ({token}) =>
    registerInvitedPasskey(credential(credentialId), hashToken(token))
  )

const sectionsOf = (passkeyId: string) =>
  Effect.map(listPasskeys, (passkeys) =>
    pipe(
      passkeys,
      Array.findFirst((passkey) => passkey.id === passkeyId),
      Option.map((passkey) => passkey.sections)
    )
  )

describe('first admin', () => {
  it('is needed until a passkey exists', async () => {
    expect(await runDb(isSetupRequired)).toBe(true)

    await runDb(registerFirstAdmin)

    expect(await runDb(isSetupRequired)).toBe(false)
  })

  it('gets every section', async () => {
    const passkey = await runDb(registerFirstAdmin)

    expect(passkey).toMatchObject({label: 'First', sections: ALL_SECTIONS})
  })

  it('cannot be set up twice', async () => {
    await runDb(registerFirstAdmin)

    const error = await runDb(
      Effect.flip(registerFirstPasskey(credential('second'), 'Second'))
    )

    expect(error).toMatchObject({status: 409})
    expect(await runDb(listPasskeys)).toHaveLength(1)
  })

  it('is created by only one of two concurrent setups', async () => {
    const results = await runDb(
      Effect.all(
        [
          Effect.either(registerFirstPasskey(credential('one'), 'One')),
          Effect.either(registerFirstPasskey(credential('two'), 'Two')),
        ],
        {concurrency: 'unbounded'}
      )
    )

    expect(Array.filter(results, Either.isRight)).toHaveLength(1)
    expect(await runDb(listPasskeys)).toHaveLength(1)
  })
})

describe('invites', () => {
  it('give the new passkey their label and sections', async () => {
    const passkey = await runDb(registerInvited('editor', ['cms', 'clubs']))

    expect(passkey).toMatchObject({
      label: 'Invited',
      sections: ['cms', 'clubs'],
    })
  })

  it('work once', async () => {
    const {token} = await runDb(createInvite('Editor', ['cms']))
    await runDb(registerInvitedPasskey(credential('one'), hashToken(token)))

    const error = await runDb(
      Effect.flip(registerInvitedPasskey(credential('two'), hashToken(token)))
    )

    expect(error).toMatchObject({status: 404})
    expect(await runDb(findInviteLabel(hashToken(token)))).toEqual(
      Option.none()
    )
  })

  it('last 5 minutes', async () => {
    await runDb(createInvite('Editor', ['cms']))

    const seconds = await secondsUntilExpiry('backoffice_invites')

    expect(seconds).toBeGreaterThan(5 * 60 - 10)
    expect(seconds).toBeLessThanOrEqual(5 * 60)
  })

  it('stop working once expired', async () => {
    const {token} = await runDb(createInvite('Editor', ['cms']))
    await expireRows('backoffice_invites')

    const error = await runDb(
      Effect.flip(registerInvitedPasskey(credential('late'), hashToken(token)))
    )

    expect(error).toMatchObject({status: 404})
    expect(await runDb(findInviteLabel(hashToken(token)))).toEqual(
      Option.none()
    )
  })

  it('stay usable when the registration fails', async () => {
    await runDb(registerFirstAdmin)
    const {token} = await runDb(createInvite('Editor', ['cms']))

    const error = await runDb(
      Effect.flip(registerInvitedPasskey(credential('first'), hashToken(token)))
    )

    expect(error).toMatchObject({status: 409})
    expect(await runDb(findInviteLabel(hashToken(token)))).toEqual(
      Option.some('Editor')
    )
  })

  it('are stored without their token', async () => {
    const {token} = await runDb(createInvite('Editor', ['cms']))

    const rows = await runSql(
      (sql) => sql`
        SELECT
          *
        FROM
          backoffice_invites
      `
    )

    expect(JSON.stringify(rows)).not.toContain(token)
  })
})

describe('sessions', () => {
  it('lead to their passkey', async () => {
    const passkey = await runDb(registerFirstAdmin)
    const token = await runDb(createSession(passkey.id))

    expect(await runDb(findSessionPasskey(token))).toEqual(Option.some(passkey))
  })

  it('are not found by an unknown token', async () => {
    const passkey = await runDb(registerFirstAdmin)
    await runDb(createSession(passkey.id))

    expect(await runDb(findSessionPasskey('unknown'))).toEqual(Option.none())
  })

  it('last 12 hours', async () => {
    const passkey = await runDb(registerFirstAdmin)
    await runDb(createSession(passkey.id))

    const seconds = await secondsUntilExpiry('backoffice_sessions')

    expect(seconds).toBeGreaterThan(12 * 60 * 60 - 10)
    expect(seconds).toBeLessThanOrEqual(12 * 60 * 60)
  })

  it('end once expired', async () => {
    const passkey = await runDb(registerFirstAdmin)
    const token = await runDb(createSession(passkey.id))

    await expireRows('backoffice_sessions')

    expect(await runDb(findSessionPasskey(token))).toEqual(Option.none())
  })

  it('end on sign-out', async () => {
    const passkey = await runDb(registerFirstAdmin)
    const token = await runDb(createSession(passkey.id))
    const otherToken = await runDb(createSession(passkey.id))

    await runDb(deleteSession(token))

    expect(await runDb(findSessionPasskey(token))).toEqual(Option.none())
    expect(await runDb(findSessionPasskey(otherToken))).toEqual(
      Option.some(passkey)
    )
  })

  it('end when their passkey is deleted', async () => {
    await runDb(registerFirstAdmin)
    const editor = await runDb(registerInvited('editor', ['cms']))
    const token = await runDb(createSession(editor.id))

    await runDb(deletePasskey(editor.id))

    expect(await runDb(findSessionPasskey(token))).toEqual(Option.none())
  })

  it('see a section change on the next lookup', async () => {
    await runDb(registerFirstAdmin)
    const editor = await runDb(registerInvited('editor', ['cms']))
    const token = await runDb(createSession(editor.id))

    await runDb(updatePasskeySections(editor.id, ['shortLinks']))

    expect(await runDb(findSessionPasskey(token))).toEqual(
      Option.some({...editor, sections: ['shortLinks']})
    )
  })

  it('ignore stored sections the code no longer knows', async () => {
    const passkey = await runDb(registerFirstAdmin)
    const token = await runDb(createSession(passkey.id))

    await runSql(
      (sql) => sql`
        UPDATE backoffice_passkeys
        SET
          permissions = '["cms", "removedSection"]'::jsonb
      `
    )

    expect(await runDb(findSessionPasskey(token))).toEqual(
      Option.some({...passkey, sections: ['cms']})
    )
  })

  it('are stored without their token', async () => {
    const passkey = await runDb(registerFirstAdmin)
    const token = await runDb(createSession(passkey.id))

    const rows = await runSql(
      (sql) => sql`
        SELECT
          *
        FROM
          backoffice_sessions
      `
    )

    expect(JSON.stringify(rows)).not.toContain(token)
  })
})

describe('last admin', () => {
  it('cannot be deleted', async () => {
    const admin = await runDb(registerFirstAdmin)
    await runDb(registerInvited('editor', ['cms']))

    const error = await runDb(Effect.flip(deletePasskey(admin.id)))

    expect(error).toMatchObject({status: 409})
    expect(await runDb(sectionsOf(admin.id))).toEqual(Option.some(ALL_SECTIONS))
  })

  it('cannot lose the Admins section', async () => {
    const admin = await runDb(registerFirstAdmin)
    await runDb(registerInvited('editor', ['cms']))

    const error = await runDb(
      Effect.flip(updatePasskeySections(admin.id, ['cms']))
    )

    expect(error).toMatchObject({status: 409})
    expect(await runDb(sectionsOf(admin.id))).toEqual(Option.some(ALL_SECTIONS))
  })

  it('can be deleted once another admin exists', async () => {
    const admin = await runDb(registerFirstAdmin)
    const other = await runDb(registerInvited('other', ['admins']))

    await runDb(deletePasskey(admin.id))

    expect(
      Array.map(await runDb(listPasskeys), (passkey) => passkey.id)
    ).toEqual([other.id])
  })

  it('can lose the Admins section once another admin exists', async () => {
    const admin = await runDb(registerFirstAdmin)
    await runDb(registerInvited('other', ['admins']))

    await runDb(updatePasskeySections(admin.id, ['cms']))

    expect(await runDb(sectionsOf(admin.id))).toEqual(Option.some(['cms']))
  })

  it('is not confused with a passkey that does not exist', async () => {
    await runDb(registerFirstAdmin)
    const unknownId = '00000000-0000-4000-8000-000000000000'

    expect(await runDb(Effect.flip(deletePasskey(unknownId)))).toMatchObject({
      status: 404,
    })
    expect(
      await runDb(Effect.flip(updatePasskeySections(unknownId, ['cms'])))
    ).toMatchObject({status: 404})
  })
})

describe('passkeys', () => {
  it('cannot be registered twice', async () => {
    await runDb(registerFirstAdmin)

    const error = await runDb(Effect.flip(registerInvited('first', ['cms'])))

    expect(error).toMatchObject({status: 409})
  })

  it('keep what the next sign-in has to verify', async () => {
    const passkey = await runDb(registerFirstAdmin)

    const stored = await runDb(findCredential('first'))

    expect(stored).toEqual(
      Option.some({
        passkeyId: passkey.id,
        id: 'first',
        publicKey: Buffer.from([1, 2, 3]),
        counter: 0,
        transports: ['internal'],
      })
    )
  })

  it('remember the signature counter and the time of each use', async () => {
    const passkey = await runDb(registerFirstAdmin)

    const used = await runDb(recordPasskeyUse(passkey.id, 7))

    expect(used).toEqual(Option.some(passkey))
    const stored = await runDb(findCredential('first'))
    expect(Option.map(stored, ({counter}) => counter)).toEqual(Option.some(7))
    const [listed] = await runDb(listPasskeys)
    expect(listed?.lastUsedAt).not.toBeNull()
  })
})

describe('challenges', () => {
  it.each<[ChallengePurpose]>([
    [{kind: 'login'}],
    [{kind: 'setup', label: 'First'}],
    [{kind: 'invite', inviteTokenHash: 'hash'}],
  ])('come back with their purpose: %j', async (purpose) => {
    const token = await runDb(saveChallenge('challenge', purpose))

    expect(await runDb(consumeChallenge(token))).toEqual(
      Option.some({challenge: 'challenge', ...purpose})
    )
  })

  it('can be used once', async () => {
    const token = await runDb(saveChallenge('challenge', {kind: 'login'}))
    await runDb(consumeChallenge(token))

    expect(await runDb(consumeChallenge(token))).toEqual(Option.none())
  })

  it('last 5 minutes', async () => {
    await runDb(saveChallenge('challenge', {kind: 'login'}))

    const seconds = await secondsUntilExpiry('backoffice_webauthn_challenges')

    expect(seconds).toBeGreaterThan(5 * 60 - 10)
    expect(seconds).toBeLessThanOrEqual(5 * 60)
  })

  it('cannot be used once expired', async () => {
    const token = await runDb(saveChallenge('challenge', {kind: 'login'}))

    await expireRows('backoffice_webauthn_challenges')

    expect(await runDb(consumeChallenge(token))).toEqual(Option.none())
  })
})

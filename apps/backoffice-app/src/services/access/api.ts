import {
  type PublicKeyCredentialCreationOptionsJSON,
  type PublicKeyCredentialRequestOptionsJSON,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser'
import {Schema} from 'effect'
import {requestJson, requestNoContent} from '../adminFetch'
import {
  type BackofficeSection,
  BackofficeSession,
  type CreateInviteRequest,
  CreateInviteResponse,
  Passkey,
  PasskeyListResponse,
  SetupStatusResponse,
} from './domain'

const post = (body?: unknown): RequestInit => ({
  method: 'POST',
  body: JSON.stringify(body ?? {}),
})

const decodeSession = Schema.decodeUnknownSync(BackofficeSession)

/** `null` when nobody is signed in. */
export const fetchSession = async (): Promise<BackofficeSession | null> => {
  const response = await fetch('/api/admin/session')
  if (response.status === 401) return null
  if (!response.ok) throw new Error('Failed to load your session')
  return decodeSession(await response.json())
}

export const fetchSetupRequired = async (): Promise<boolean> =>
  Schema.decodeUnknownSync(SetupStatusResponse)(
    await requestJson<unknown>('/api/auth/setup', {method: 'GET'})
  ).setupRequired

const registerPasskey = async (
  optionsUrl: string,
  body: unknown
): Promise<BackofficeSession> => {
  const optionsJSON = await requestJson<PublicKeyCredentialCreationOptionsJSON>(
    optionsUrl,
    post(body)
  )
  const registration = await startRegistration({optionsJSON})
  return decodeSession(
    await requestJson<unknown>('/api/auth/register', post(registration))
  )
}

export const setUpFirstAdmin = (
  adminToken: string,
  label: string
): Promise<BackofficeSession> =>
  registerPasskey('/api/auth/setup', {adminToken, label})

export const registerFromInvite = (
  inviteToken: string
): Promise<BackofficeSession> =>
  registerPasskey('/api/auth/invite', {inviteToken})

export const signInWithPasskey = async (): Promise<BackofficeSession> => {
  const optionsJSON = await requestJson<PublicKeyCredentialRequestOptionsJSON>(
    '/api/auth/login/options',
    post()
  )
  const authentication = await startAuthentication({optionsJSON})
  return decodeSession(
    await requestJson<unknown>('/api/auth/login', post(authentication))
  )
}

export const signOut = (): Promise<void> =>
  requestNoContent('/api/auth/logout', post())

export const listPasskeys = async (): Promise<readonly Passkey[]> =>
  Schema.decodeUnknownSync(PasskeyListResponse)(
    await requestJson<unknown>('/api/admin/passkeys', {method: 'GET'})
  ).passkeys

export const updatePasskeySections = async (
  id: string,
  sections: readonly BackofficeSection[]
): Promise<Passkey> =>
  Schema.decodeUnknownSync(Schema.Struct({passkey: Passkey}))(
    await requestJson<unknown>(`/api/admin/passkeys/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({sections}),
    })
  ).passkey

export const deletePasskey = (id: string): Promise<void> =>
  requestNoContent(`/api/admin/passkeys/${id}`, {method: 'DELETE'})

export const createInvite = async (
  input: CreateInviteRequest
): Promise<CreateInviteResponse> =>
  Schema.decodeUnknownSync(CreateInviteResponse)(
    await requestJson<unknown>('/api/admin/invites', post(input))
  )

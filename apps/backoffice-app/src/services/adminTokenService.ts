import {Option, Schema} from 'effect'

const ADMIN_TOKEN_KEY = 'vexl_admin_token'
const ROLE_KEY = 'vexl_backoffice_role'

/** `contentEditor` tokens can only manage blog posts and events. */
export const BackofficeRole = Schema.Literal('admin', 'contentEditor')
export type BackofficeRole = typeof BackofficeRole.Type

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

/** Only decides what the UI shows. The backends enforce access. */
export function getRole(): BackofficeRole | null {
  if (typeof window === 'undefined') return null
  return Option.getOrNull(
    Schema.decodeUnknownOption(BackofficeRole)(localStorage.getItem(ROLE_KEY))
  )
}

export function setSession(token: string, role: BackofficeRole): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(ADMIN_TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

export const homePathForRole = (role: BackofficeRole | null): string =>
  role === 'contentEditor' ? '/blog-posts' : '/clubs'

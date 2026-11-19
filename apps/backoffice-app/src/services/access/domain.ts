import {Schema} from 'effect'

export const BackofficeSection = Schema.Literal(
  'clubs',
  'bannedNumbers',
  'productNotifications',
  'slideshows',
  'shortLinks',
  'cms',
  'admins'
)
export type BackofficeSection = typeof BackofficeSection.Type

export const ALL_SECTIONS = BackofficeSection.literals

export const SECTION_NAMES: Readonly<Record<BackofficeSection, string>> = {
  clubs: 'Clubs',
  bannedNumbers: 'Banned numbers',
  productNotifications: 'Product notifications',
  slideshows: 'TV slideshows',
  shortLinks: 'Short links',
  cms: 'Blog posts and events',
  admins: 'Admins',
}

export const Sections = Schema.NonEmptyArray(BackofficeSection)
export type Sections = typeof Sections.Type

export const PasskeyLabel = Schema.Trim.pipe(
  Schema.minLength(1),
  Schema.maxLength(100)
)

export const BackofficeSession = Schema.Struct({
  label: Schema.String,
  sections: Schema.Array(BackofficeSection),
})
export type BackofficeSession = typeof BackofficeSession.Type

export const SetupStatusResponse = Schema.Struct({
  setupRequired: Schema.Boolean,
})

export const SetupOptionsRequest = Schema.Struct({
  adminToken: Schema.String,
  label: PasskeyLabel,
})

export const InviteOptionsRequest = Schema.Struct({
  inviteToken: Schema.String,
})

export const Passkey = Schema.Struct({
  id: Schema.UUID,
  label: Schema.String,
  sections: Schema.Array(BackofficeSection),
  createdAt: Schema.String,
  lastUsedAt: Schema.NullOr(Schema.String),
})
export type Passkey = typeof Passkey.Type

export const PasskeyListResponse = Schema.Struct({
  passkeys: Schema.Array(Passkey),
})

export const UpdatePasskeyRequest = Schema.Struct({
  sections: Sections,
})

export const CreateInviteRequest = Schema.Struct({
  label: PasskeyLabel,
  sections: Sections,
})
export type CreateInviteRequest = typeof CreateInviteRequest.Type

export const CreateInviteResponse = Schema.Struct({
  inviteUrl: Schema.String,
  expiresAt: Schema.String,
})
export type CreateInviteResponse = typeof CreateInviteResponse.Type

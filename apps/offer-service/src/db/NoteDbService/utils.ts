import {type PgClient} from '@effect/sql-pg'
import {type Fragment} from '@effect/sql/Statement'
import {Schema} from 'effect'
import {NoteParts, NotePartsWithNoteForUserUpdateCounter} from './domain'

export const noteSelect = (sql: PgClient.PgClient): Fragment => sql`
  note_public.id AS "note_public.id",
  note_public.admin_id AS "note_public.admin_id",
  note_public.note_id AS "note_public.note_id",
  note_public.payload_public AS "note_public.payload_public",
  note_public.expires_at AS "note_public.expires_at",
  note_public.created_at AS "note_public.created_at",
  note_public.report AS "note_public.report",
  note_private.id AS "note_private.id",
  note_private.note_id AS "note_private.note_id",
  note_private.user_public_key AS "note_private.user_public_key",
  note_private.payload_private AS "note_private.payload_private"
`

export const NoteSelectRecord = Schema.Struct({
  'notePublic.id': Schema.String,
  'notePublic.adminId': Schema.String,
  'notePublic.noteId': Schema.String,
  'notePublic.payloadPublic': Schema.String,
  'notePublic.expiresAt': Schema.DateFromSelf,
  'notePublic.createdAt': Schema.DateFromSelf,
  'notePublic.report': Schema.Int,
  'notePrivate.id': Schema.String,
  'notePrivate.noteId': Schema.String,
  'notePrivate.userPublicKey': Schema.String,
  'notePrivate.payloadPrivate': Schema.String,
})

export const NoteSelectToNoteParts = Schema.transform(
  NoteSelectRecord,
  NoteParts,
  {
    strict: true,
    decode: (v) => ({
      privatePart: {
        id: v['notePrivate.id'],
        noteId: v['notePrivate.noteId'],
        userPublicKey: v['notePrivate.userPublicKey'],
        payloadPrivate: v['notePrivate.payloadPrivate'],
      },
      publicPart: {
        id: v['notePublic.id'],
        adminId: v['notePublic.adminId'],
        noteId: v['notePublic.noteId'],
        payloadPublic: v['notePublic.payloadPublic'],
        expiresAt: v['notePublic.expiresAt'],
        createdAt: v['notePublic.createdAt'],
        report: v['notePublic.report'],
      },
    }),
    encode: (v) => ({
      'notePrivate.id': v.privatePart.id,
      'notePrivate.noteId': v.privatePart.noteId,
      'notePrivate.userPublicKey': v.privatePart.userPublicKey,
      'notePrivate.payloadPrivate': v.privatePart.payloadPrivate,
      'notePublic.id': v.publicPart.id,
      'notePublic.adminId': v.publicPart.adminId,
      'notePublic.noteId': v.publicPart.noteId,
      'notePublic.payloadPublic': v.publicPart.payloadPublic,
      'notePublic.expiresAt': v.publicPart.expiresAt,
      'notePublic.createdAt': v.publicPart.createdAt,
      'notePublic.report': v.publicPart.report,
    }),
  }
)

export const NoteSelectWithNoteForUserUpdateCounterRecord = Schema.Struct({
  ...NoteSelectRecord.fields,
  noteForUserUpdateCounter: Schema.String,
})

export const NoteSelectWithNoteForUserUpdateCounterToNoteParts =
  Schema.transform(
    NoteSelectWithNoteForUserUpdateCounterRecord,
    NotePartsWithNoteForUserUpdateCounter,
    {
      strict: true,
      decode: (v) => ({
        privatePart: {
          id: v['notePrivate.id'],
          noteId: v['notePrivate.noteId'],
          userPublicKey: v['notePrivate.userPublicKey'],
          payloadPrivate: v['notePrivate.payloadPrivate'],
        },
        publicPart: {
          id: v['notePublic.id'],
          adminId: v['notePublic.adminId'],
          noteId: v['notePublic.noteId'],
          payloadPublic: v['notePublic.payloadPublic'],
          expiresAt: v['notePublic.expiresAt'],
          createdAt: v['notePublic.createdAt'],
          report: v['notePublic.report'],
        },
        noteForUserUpdateCounter: v.noteForUserUpdateCounter,
      }),
      encode: (v) => ({
        'notePrivate.id': v.privatePart.id,
        'notePrivate.noteId': v.privatePart.noteId,
        'notePrivate.userPublicKey': v.privatePart.userPublicKey,
        'notePrivate.payloadPrivate': v.privatePart.payloadPrivate,
        'notePublic.id': v.publicPart.id,
        'notePublic.adminId': v.publicPart.adminId,
        'notePublic.noteId': v.publicPart.noteId,
        'notePublic.payloadPublic': v.publicPart.payloadPublic,
        'notePublic.expiresAt': v.publicPart.expiresAt,
        'notePublic.createdAt': v.publicPart.createdAt,
        'notePublic.report': v.publicPart.report,
        noteForUserUpdateCounter: v.noteForUserUpdateCounter,
      }),
    }
  )

export const noteNotExpired = (sql: PgClient.PgClient): Fragment => sql`
  note_public.expires_at > now()
`

export const noteNotFlagged = (
  sql: PgClient.PgClient,
  noteReportFilter: number
): Fragment => sql` note_public.report < ${noteReportFilter} `

import {Array, Schema} from 'effect'

// Mirrors `FriendLevel` in `@vexl-next/domain`, which this package cannot depend on.
export type FriendLevel =
  | 'FIRST_DEGREE'
  | 'SECOND_DEGREE'
  | 'CLUB'
  | 'NOT_SPECIFIED'

export const OfferClass = Schema.Literal('main', 'mainAndClub')
export type OfferClass = typeof OfferClass.Type

export const RequestClass = Schema.Literal('main', 'club')
export type RequestClass = typeof RequestClass.Type

export type CoreActionClass = OfferClass | RequestClass

export const createdOfferClass = (sharedToClubsCount: number): OfferClass =>
  sharedToClubsCount > 0 ? 'mainAndClub' : 'main'

/** Club when the offer reached the device only through Clubs. */
export const sentRequestClass = (
  friendLevel: readonly FriendLevel[]
): RequestClass =>
  Array.contains(friendLevel, 'CLUB') &&
  !Array.contains(friendLevel, 'FIRST_DEGREE') &&
  !Array.contains(friendLevel, 'SECOND_DEGREE')
    ? 'club'
    : 'main'

/** Approving is main, also on an offer shared to Clubs. */
export const approvedRequestClass: CoreActionClass = 'main'

export const isMainCoreAction = (actionClass: CoreActionClass): boolean =>
  actionClass !== 'club'

export const isClubCoreAction = (actionClass: CoreActionClass): boolean =>
  actionClass !== 'main'

export const coreActivityFields = {
  coreActionMain: Schema.optional(Schema.Boolean),
  coreActionClub: Schema.optional(Schema.Boolean),
}
export type CoreActivity = Schema.Struct.Type<typeof coreActivityFields>

/** Updater for the activity aggregations. */
export const markCoreAction =
  (actionClass: CoreActionClass) =>
  <S extends CoreActivity>(state: S): S => ({
    ...state,
    ...(isMainCoreAction(actionClass) ? {coreActionMain: true} : {}),
    ...(isClubCoreAction(actionClass) ? {coreActionClub: true} : {}),
  })

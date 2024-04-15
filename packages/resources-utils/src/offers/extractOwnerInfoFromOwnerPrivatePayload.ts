import {
  type OfferPrivatePart,
  type OwnershipInfo,
} from '@vexl-next/domain/src/general/offers'
import {
  toBasicError,
  type BasicError,
} from '@vexl-next/domain/src/utility/errors'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'

export type UnknownConnectionLevelError =
  BasicError<'UnknownConnectionLevelError'>
export type NoAdminIdError = BasicError<'NoAdminIdError'>

export default function extractOwnerInfoFromOwnerPrivatePayload(
  privatePart: OfferPrivatePart
): TE.TaskEither<UnknownConnectionLevelError | NoAdminIdError, OwnershipInfo> {
  return pipe(
    TE.right(privatePart),
    TE.bindTo('privatePart'),
    TE.bindW('intendedConnectionLevel', ({privatePart}) => {
      return TE.fromNullable(
        toBasicError('UnknownConnectionLevelError')(
          new Error('intendedConnection is not defined')
        )
      )(privatePart.intendedConnectionLevel)
    }),
    TE.bindW('adminId', ({privatePart}) => {
      return TE.fromNullable(
        toBasicError('NoAdminIdError')(new Error('adminId is not defined'))
      )(privatePart.adminId)
    }),
    TE.map(
      ({adminId, intendedConnectionLevel}) =>
        ({
          adminId,
          intendedConnectionLevel,
        }) satisfies OwnershipInfo
    )
  )
}

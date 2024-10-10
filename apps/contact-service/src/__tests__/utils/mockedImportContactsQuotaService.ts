import {Effect, Layer} from 'effect'
import {ImportContactsQuotaService} from '../../routes/contacts/importContactsQuotaService'

export const mockedGetImportedContactsCountToReachQuotaForPhoneNumber = jest.fn(
  () => () => Effect.succeed(10)
)
export const mockedIncrementImportContactsQuota = jest.fn(
  () => () => Effect.void
)
export const mockedDeleteImportContactsQuotaRecord = jest.fn(
  () => () => Effect.void
)

export const mockedImportContactsQuotaService = Layer.succeed(
  ImportContactsQuotaService,
  {
    getImportedContactsCountToReachQuotaForPhoneNumber:
      mockedGetImportedContactsCountToReachQuotaForPhoneNumber,
    incrementImportContactsQuota: mockedIncrementImportContactsQuota,
    deleteImportContactsQuotaRecord: mockedDeleteImportContactsQuotaRecord,
  }
)

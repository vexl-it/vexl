import {HashedPhoneNumberE} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Schema} from 'effect'

export const ContactRecordId = Schema.BigInt.pipe(
  Schema.brand('ContactRecordId')
)
export type ContactRecordId = Schema.Schema.Type<typeof ContactRecordId>

export class ContactRecord extends Schema.Class<ContactRecord>('ContactRecord')(
  {
    id: ContactRecordId,
    hashFrom: HashedPhoneNumberE,
    hashTo: HashedPhoneNumberE,
  }
) {}

import {Schema} from 'effect'
import {ServerHashedNumber} from '../../utils/serverHashContact'

export const ContactRecordId = Schema.BigInt.pipe(
  Schema.brand('ContactRecordId')
)
export type ContactRecordId = Schema.Schema.Type<typeof ContactRecordId>

export class ContactRecord extends Schema.Class<ContactRecord>('ContactRecord')(
  {
    id: ContactRecordId,
    hashFrom: ServerHashedNumber,
    hashTo: ServerHashedNumber,
  }
) {}

import {type InvoiceId} from '@vexl-next/rest-api/src/services/content/contracts'
import {Schema} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {atomWithParsedMmkvStorageE} from '../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {type FocusAtomType} from '../../utils/atomUtils/FocusAtomType'
import {MyDonation} from './domain'

const myDonationsStorageAtom = atomWithParsedMmkvStorageE(
  'myDonations',
  {data: [], state: 'loaded'},
  Schema.Struct({
    data: Schema.Array(MyDonation).pipe(Schema.mutable),
    state: Schema.Literal('loading', 'loaded'),
  })
)

export const myDonationsAtom = focusAtom(myDonationsStorageAtom, (optic) =>
  optic.prop('data')
)

export const myDonationsSortedAtom = atom((get) =>
  get(myDonationsAtom).sort((a, b) => b.createdTime - a.createdTime)
)

export const myDonationsAtomsAtom = splitAtom(myDonationsSortedAtom)

export const myDonationsStateAtom = focusAtom(myDonationsStorageAtom, (optic) =>
  optic.prop('state')
)

export function singleDonationAtom(
  invoiceid: InvoiceId
): FocusAtomType<MyDonation | undefined> {
  return focusAtom(myDonationsAtom, (optic) =>
    optic.find((myDonation) => myDonation.invoiceId === invoiceid)
  )
}

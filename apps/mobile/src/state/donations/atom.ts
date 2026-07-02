import {type InvoiceId} from '@vexl-next/rest-api/src/services/content/contracts'
import {Schema} from 'effect'
import {atom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {splitAtom} from 'jotai/utils'
import {atomWithParsedMmkvStorageWithImmediateSaveOption} from '../../utils/atomUtils/atomWithParsedMmkvStorage'
import {type FocusAtomType} from '../../utils/atomUtils/FocusAtomType'
import {MyDonation} from './domain'

const myDonationsStorage = atomWithParsedMmkvStorageWithImmediateSaveOption(
  'myDonations',
  {data: []},
  Schema.Struct({
    data: Schema.Array(MyDonation).pipe(Schema.mutable),
  })
)

export const myDonationsAtom = focusAtom(myDonationsStorage.atom, (optic) =>
  optic.prop('data')
)

export const myDonationsSortedAtom = atom((get) =>
  get(myDonationsAtom).sort((a, b) => b.createdTime - a.createdTime)
)

export const myDonationsAtomsAtom = splitAtom(myDonationsSortedAtom)

export function singleDonationAtom(
  invoiceid: InvoiceId
): FocusAtomType<MyDonation | undefined> {
  return focusAtom(myDonationsAtom, (optic) =>
    optic.find((myDonation) => myDonation.invoiceId === invoiceid)
  )
}

export const setMyDonationsAndSaveImmediatelyActionAtom =
  myDonationsStorage.setAndSaveImmediatelyAtom

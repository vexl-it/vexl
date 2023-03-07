import {atom, useAtom, useAtomValue} from 'jotai'
import {toE164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import * as O from 'fp-ts/Option'
import {type Option} from 'fp-ts/Option'
import {fsSafeParseE} from '../../../utils/fsUtils'
import {pipe} from 'fp-ts/function'
import {ContactNormalized} from '../brands/ContactNormalized.brand'

export interface SearchBarState {
  text: string
  canBeAddedAsANumber: string
}

export const searchTextAtom = atom('')

const searchTextAsCustomContact = atom((get) => {
  const searchText = get(searchTextAtom)

  return pipe(
    searchText,
    toE164PhoneNumber,
    O.chain((e164) =>
      O.fromEither(
        fsSafeParseE(ContactNormalized)({
          normalizedNumber: e164,
          numberToDisplay: searchText,
          name: searchText,
          fromContactList: false,
        })
      )
    )
  )
})

export function useSearchText(): [
  string,
  (args: ((prev: string) => string) | string) => void
] {
  return useAtom(searchTextAtom)
}

export function useSearchTextValue(): string {
  return useAtomValue(searchTextAtom)
}

export function useSearchTextAsCustomContact(): Option<ContactNormalized> {
  return useAtomValue(searchTextAsCustomContact)
}

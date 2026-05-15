import {SearchBar} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {atom, useSetAtom, useStore} from 'jotai'
import React, {useMemo, useRef} from 'react'
import {debounce} from 'tamagui'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {contactSelectMolecule} from '../atom'

function ContactSearchBar({
  addContactRequestId,
}: {
  readonly addContactRequestId: number
}): React.ReactElement {
  const {t} = useTranslation()
  const store = useStore()
  const {searchTextAtom} = useMolecule(contactSelectMolecule)
  const setSearchText = useSetAtom(searchTextAtom)

  const setSearchTextRef = useRef(setSearchText)
  setSearchTextRef.current = setSearchText

  const debouncedSetSearchTextRef = useRef(
    debounce((text: string) => {
      setSearchTextRef.current(text)
    }, 500)
  )

  const searchInputAtom = useMemo(() => {
    const inputAtom = atom(store.get(searchTextAtom))

    return atom(
      (get) => get(inputAtom),
      (get, set, update: React.SetStateAction<string>) => {
        const previousValue = get(inputAtom)
        const nextValue =
          typeof update === 'function' ? update(previousValue) : update

        set(inputAtom, nextValue)

        if (nextValue.trim() === '') {
          setSearchTextRef.current('')
        } else {
          debouncedSetSearchTextRef.current(nextValue)
        }
      }
    )
  }, [searchTextAtom, store])

  return (
    <SearchBar
      key={addContactRequestId}
      autoFocus={addContactRequestId > 0}
      testID="@searchBar/contactInput"
      valueAtom={searchInputAtom}
      placeholder={t('common.search')}
    />
  )
}

export default ContactSearchBar

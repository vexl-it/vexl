import {type Sort} from '@vexl-next/domain/src/general/offers'
import {atom, useAtom, useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {Stack, getTokens} from 'tamagui'
import {selectedMyOffersSortingOptionAtom} from '../../../state/marketplace/atoms/myOffers'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {Dropdown, type DropdownItemProps} from '../../Dropdown'

const myOffersSortingOptionsAtom = atom<Array<DropdownItemProps<Sort>>>(
  (get) => {
    const {t} = get(translationAtom)

    return [
      {
        label: t('myOffers.sortedByNewest'),
        value: 'NEWEST_OFFER',
      },
      {
        label: t('myOffers.sortedByOldest'),
        value: 'OLDEST_OFFER',
      },
    ]
  }
)

function MyOffersSortingDropdown(): JSX.Element {
  const [myOffersSortingOption, setMyOffersSortingOption] = useAtom(
    selectedMyOffersSortingOptionAtom
  )
  const myOffersSortingOptions = useAtomValue(myOffersSortingOptionsAtom)

  const selectedLabel = useMemo(
    () =>
      myOffersSortingOptions.find(
        (option) => option.value === myOffersSortingOption
      )?.label,
    [myOffersSortingOption, myOffersSortingOptions]
  )

  return (
    <Stack f={1}>
      <Dropdown
        containerStyle={{
          backgroundColor: getTokens().color.grey.val,
          borderRadius: getTokens().radius[4].val,
          borderWidth: 0,
        }}
        data={myOffersSortingOptions}
        onChange={(item) => {
          if (item.value) setMyOffersSortingOption(item.value)
        }}
        value={{value: myOffersSortingOption, label: selectedLabel ?? ''}}
      />
    </Stack>
  )
}

export default MyOffersSortingDropdown

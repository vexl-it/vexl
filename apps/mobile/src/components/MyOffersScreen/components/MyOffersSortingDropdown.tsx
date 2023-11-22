import React, {useMemo} from 'react'
import {atom, useAtom, useAtomValue} from 'jotai'
import {selectedMyOffersSortingOptionAtom} from '../../../state/marketplace/atoms/myOffers'
import {type Sort} from '@vexl-next/domain/dist/general/offers'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {type DropdownItemProps, Dropdown} from '../../Dropdown'
import {getTokens, Stack} from 'tamagui'

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

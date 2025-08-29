import {type GetGeocodedCoordinatesResponse} from '@vexl-next/rest-api/src/services/location/contracts'
import {useSetAtom, useStore} from 'jotai'
import React, {useMemo, useState} from 'react'
import {YStack} from 'tamagui'
import backButtonSvg from '../../../../../images/backButtonSvg'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import IconButton from '../../../../IconButton'
import Input from '../../../../Input'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'
import MapLocationSelect from '../../../../Map/components/MapLocationSelect'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../PageWithNavigationHeader'
import {
  addMeetingLocationActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../utils'
import {useSetFullscreen} from '../../TradeChecklistFlowPageContainer'

type Props = TradeChecklistStackScreenProps<'LocationMapSelect'>

export default function LocationMapSelect({
  navigation,
  route: {
    params: {searchQuery, selectedLocation},
  },
  navigation: {goBack},
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const initialValue = useMemo(() => {
    const address = `${selectedLocation.userData.suggestFirstRow}, ${selectedLocation.userData.suggestSecondRow}`
    return {...selectedLocation.userData, address}
  }, [selectedLocation])
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  useSetFullscreen()
  const shouldSubmitUpdateOnPick = !useWasOpenFromAgreeOnTradeDetailsScreen()
  const store = useStore()

  const [pickedValue, setPickedValue] =
    useState<GetGeocodedCoordinatesResponse | null>(null)
  const [note, setNote] = useState(searchQuery)

  const stageMeetingLocation = useSetAtom(addMeetingLocationActionAtom)

  function onSubmit(): void {
    if (!pickedValue) return

    const toSubmit = {
      ...pickedValue,
      note: note.trim() || undefined,
    }
    stageMeetingLocation(toSubmit)

    if (!shouldSubmitUpdateOnPick) {
      navigation.navigate('AgreeOnTradeDetails')
    } else {
      showLoadingOverlay(true)
      void submitTradeChecklistUpdates()()
        .then((success) => {
          if (!success) return
          navigation.navigate('ChatDetail', store.get(chatWithMessagesKeys))
        })
        .finally(() => {
          showLoadingOverlay(false)
        })
    }
  }

  return (
    <>
      <HeaderProxy hidden hiddenAllTheWay />
      <MapLocationSelect
        mapPadding={{top: 150, bottom: 150, left: 0, right: 0}}
        initialValue={initialValue}
        onPick={setPickedValue}
        topChildren={
          <YStack marginVertical="$2" marginHorizontal="$4" gap="$4">
            <IconButton
              variant="primary"
              icon={backButtonSvg}
              onPress={goBack}
            />
          </YStack>
        }
        bottomChildren={
          <YStack margin="$2" gap="$2">
            <Input
              value={note}
              onChangeText={setNote}
              placeholder={t('tradeChecklist.location.addNote')}
              variant="black"
            />
            <Button
              onPress={onSubmit}
              variant="secondary"
              text={t('common.save')}
              disabled={!pickedValue}
            />
          </YStack>
        }
      />
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy hidden />
    </>
  )
}

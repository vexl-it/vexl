import {type GetGeocodedCoordinatesResponse} from '@vexl-next/rest-api/src/services/location/contracts'
import {useMemo, useState} from 'react'
import {YStack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import Button from '../../../../Button'
import Input from '../../../../Input'
import MapLocationSelect from '../../../../Map/components/MapLocationSelect'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import IconButton from '../../../../IconButton'
import backButtonSvg from '../../../../../images/backButtonSvg'
import {
  addMeetingLocationActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../atoms/updatesToBeSentAtom'
import {useSetAtom} from 'jotai'
import {useGoBackXTimes} from '../../../../../utils/navigation'
import {
  FooterButtonProxy,
  HeaderProxy,
} from '../../../../PageWithNavigationHeader'
import {useSetFullscreen} from '../../TradeChecklistFlowPageContainer'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'

type Props = TradeChecklistStackScreenProps<'LocationMapSelect'>
export default function LocationMapSelect({
  navigation,
  route: {
    params: {selectedLocation, submitUpdateOnPick},
  },
  navigation: {goBack},
}: Props): JSX.Element {
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

  const [pickedValue, setPickedValue] =
    useState<GetGeocodedCoordinatesResponse | null>(null)
  const [note, setNote] = useState('')

  const stageMeetingLocation = useSetAtom(addMeetingLocationActionAtom)
  const goBackXTimes = useGoBackXTimes()

  function onSubmit(): void {
    if (!pickedValue) return

    const toSubmit = {
      ...pickedValue,
      note: note.trim() || undefined,
    }
    stageMeetingLocation(toSubmit)

    if (!submitUpdateOnPick) {
      navigation.navigate('AgreeOnTradeDetails')
    } else {
      showLoadingOverlay(true)
      void submitTradeChecklistUpdates()()
        .then((success) => {
          if (!success) return
          goBackXTimes(3)
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
        initialValue={initialValue}
        onPick={setPickedValue}
        topChildren={
          <YStack marginVertical="$2" marginHorizontal="$4" space="$4">
            <IconButton
              variant={'primary'}
              icon={backButtonSvg}
              onPress={goBack}
            />
          </YStack>
        }
        bottomChildren={
          <YStack margin="$2" space="$2">
            <Input
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
      <FooterButtonProxy hidden onPress={() => {}} />
    </>
  )
}

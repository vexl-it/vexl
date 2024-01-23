import {useSetAtom} from 'jotai'
import {XStack, YStack} from 'tamagui'
import backButtonSvg from '../../../../../images/backButtonSvg'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import IconButton from '../../../../IconButton'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'
import MapSingleLocationDisplay from '../../../../Map/components/MapSingleLocationDisplay'
import {
  HeaderProxy,
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../../PageWithNavigationHeader'
import {
  addMeetingLocationActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../atoms/updatesToBeSentAtom'
import {useSetFullscreen} from '../../TradeChecklistFlowPageContainer'

type Props = TradeChecklistStackScreenProps<'LocationMapPreview'>
export default function LocationMapPreview({
  navigation,
  route: {
    params: {selectedLocation, submitUpdateOnPick},
  },
}: Props): JSX.Element {
  const stageLocation = useSetAtom(addMeetingLocationActionAtom)
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const {t} = useTranslation()

  useSetFullscreen()

  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )

  function submit(): void {
    stageLocation(selectedLocation)
    if (!submitUpdateOnPick) {
      navigation.navigate('AgreeOnTradeDetails')
    } else {
      showLoadingOverlay(true)
      void submitTradeChecklistUpdates()()
        .then((success) => {
          if (!success) return
          navigation.goBack()
        })
        .finally(() => {
          showLoadingOverlay(false)
        })
    }
  }

  return (
    <>
      <HeaderProxy hidden hiddenAllTheWay />
      <MapSingleLocationDisplay
        mapPadding={{top: 40, bottom: 40, left: 0, right: 0}}
        topChildren={
          <YStack marginVertical="$2" marginHorizontal="$4" space="$4">
            <IconButton
              variant="primary"
              icon={backButtonSvg}
              onPress={navigation.goBack}
            />
          </YStack>
        }
        bottomChildren={
          <XStack gap="$2" marginHorizontal="$2">
            <Button
              size="small"
              fullSize
              text={t('map.location.suggestDifferent')}
              variant="primary"
              onPress={() => {
                navigation.navigate('LocationSearch', {
                  submitUpdateOnPick,
                })
              }}
            />
            <Button
              fullSize
              size="small"
              text={t('common.accept')}
              variant="secondary"
              onPress={submit}
            />
          </XStack>
        }
        value={selectedLocation}
      />
      <PrimaryFooterButtonProxy hidden />
      <SecondaryFooterButtonProxy hidden />
    </>
  )
}

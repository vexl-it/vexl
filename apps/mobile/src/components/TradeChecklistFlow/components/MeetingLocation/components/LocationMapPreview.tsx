import {useSetAtom, useStore} from 'jotai'
import {XStack, YStack} from 'tamagui'
import backButtonSvg from '../../../../../images/backButtonSvg'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
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
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../utils'
import {useSetFullscreen} from '../../TradeChecklistFlowPageContainer'

type Props = TradeChecklistStackScreenProps<'LocationMapPreview'>
export default function LocationMapPreview({
  navigation,
  route: {
    params: {selectedLocation},
  },
}: Props): JSX.Element {
  const stageLocation = useSetAtom(addMeetingLocationActionAtom)
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const {t} = useTranslation()
  const submitUpdateOnPick = !useWasOpenFromAgreeOnTradeDetailsScreen()
  const store = useStore()

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
      <MapSingleLocationDisplay
        mapPadding={{top: 40, bottom: 40, left: 0, right: 0}}
        topChildren={
          <YStack marginVertical="$2" marginHorizontal="$4" gap="$4">
            <IconButton
              variant="primary"
              icon={backButtonSvg}
              onPress={navigation.goBack}
            />
          </YStack>
        }
        bottomChildren={
          <XStack gap="$2" marginHorizontal="$2" mb="$2">
            <Button
              fullSize
              text={t('map.location.suggestDifferent')}
              variant="primary"
              onPress={() => {
                navigation.navigate('LocationSearch')
              }}
            />
            <Button
              fullSize
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

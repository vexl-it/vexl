import {
  BottomSheetPanel,
  Button,
  ChevronLeft,
  FadeGradient,
  MapLabelPill,
  NavigationBar,
  Stack,
  Typography,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useSetAtom} from 'jotai'
import React from 'react'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import MapSingleLocationDisplay from '../../../../Map/components/MapSingleLocationDisplay'
import {addMeetingLocationActionAtom} from '../../../atoms/updatesToBeSentAtom'
import {useTradeChecklistExitNavigation} from '../../../useTradeChecklistExitNavigation'

type Props = TradeChecklistStackScreenProps<'LocationMapPreview'>

const addressFieldHeight = 54

export default function LocationMapPreview({
  navigation,
  route: {
    params: {selectedLocation},
  },
}: Props): React.ReactElement {
  const stageLocation = useSetAtom(addMeetingLocationActionAtom)
  const tradeChecklistExitNavigation = useTradeChecklistExitNavigation()
  const {t} = useTranslation()
  const noteText =
    selectedLocation.note ?? `${t('tradeChecklist.location.addNote')}...`

  function submit(): void {
    stageLocation(selectedLocation)
    tradeChecklistExitNavigation()
  }

  return (
    <MapSingleLocationDisplay
      interactive={false}
      mapPadding={{top: 220, bottom: 220, left: 0, right: 0}}
      topChildren={
        <YStack>
          <YStack backgroundColor="$backgroundPrimary">
            <NavigationBar
              style="back"
              title={t('tradeChecklist.options.MEETING_LOCATION')}
              leftAction={{icon: ChevronLeft, onPress: navigation.goBack}}
            />
          </YStack>
          <Stack position="relative" height={addressFieldHeight}>
            <FadeGradient solidEdge="top" />
            <XStack
              mx="$5"
              px="$4"
              py="$2"
              gap="$3"
              height={addressFieldHeight}
              ai="center"
              borderRadius="$5"
              backgroundColor="$backgroundSecondary"
            >
              <Typography
                flex={1}
                numberOfLines={1}
                variant="paragraph"
                color="$foregroundPrimary"
              >
                {selectedLocation.address}
              </Typography>
              <Button
                variant="secondary"
                size="small"
                onPress={() => {
                  navigation.navigate('LocationMapSelect', {
                    initialLocation: selectedLocation,
                  })
                }}
              >
                {t('common.change')}
              </Button>
            </XStack>
          </Stack>
        </YStack>
      }
      middleChildren={
        <MapLabelPill variant="highlight" label={selectedLocation.address} />
      }
      bottomChildren={
        <BottomSheetPanel>
          {!!noteText && (
            <YStack gap="$2">
              <Typography
                variant="descriptionBold"
                color="$foregroundSecondary"
              >
                {t('tradeChecklist.location.note', {note: noteText})}
              </Typography>
              <Typography
                variant="paragraphSmall"
                color={
                  selectedLocation.note
                    ? '$foregroundPrimary'
                    : '$foregroundTertiary'
                }
              >
                {noteText}
              </Typography>
            </YStack>
          )}
          <Button onPress={submit}>{t('common.accept')}</Button>
        </BottomSheetPanel>
      }
      value={selectedLocation}
    />
  )
}

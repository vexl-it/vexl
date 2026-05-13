import {Button, ChevronLeft, IconButton, Typography} from '@vexl-next/ui'
import {Effect} from 'effect/index'
import {LinearGradient} from 'expo-linear-gradient'
import {useSetAtom, useStore} from 'jotai'
import React from 'react'
import {Stack, XStack, YStack, useTheme} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'
import MapSingleLocationDisplay from '../../../../Map/components/MapSingleLocationDisplay'
import {
  addMeetingLocationActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../utils'

type Props = TradeChecklistStackScreenProps<'LocationMapPreview'>

const addressFieldHeight = 54

export default function LocationMapPreview({
  navigation,
  route: {
    params: {selectedLocation},
  },
}: Props): React.ReactElement {
  const stageLocation = useSetAtom(addMeetingLocationActionAtom)
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const {t} = useTranslation()
  const theme = useTheme()
  const submitUpdateOnPick = !useWasOpenFromAgreeOnTradeDetailsScreen()
  const store = useStore()
  const noteText =
    selectedLocation.note ?? `${t('tradeChecklist.location.addNote')}...`

  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )

  function submit(): void {
    stageLocation(selectedLocation)
    if (!submitUpdateOnPick) {
      navigation.popTo('AgreeOnTradeDetails')
    } else {
      showLoadingOverlay(true)
      void Effect.runPromise(submitTradeChecklistUpdates())
        .then((success) => {
          if (!success) return
          navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
        })
        .finally(() => {
          showLoadingOverlay(false)
        })
    }
  }

  return (
    <MapSingleLocationDisplay
      interactive={false}
      mapPadding={{top: 220, bottom: 220, left: 0, right: 0}}
      topChildren={
        <YStack>
          <YStack backgroundColor="$backgroundPrimary" pb="$5">
            <XStack px="$5" pt="$4" ai="center">
              <IconButton
                backgroundColor="$accentYellowSecondary"
                onPress={navigation.goBack}
              >
                <ChevronLeft
                  size={24}
                  color={theme.accentHighlightSecondary.get()}
                />
              </IconButton>
              <Stack f={1} ai="center">
                <Typography
                  variant="titlesSmall"
                  color="$foregroundPrimary"
                  textAlign="center"
                >
                  {t('tradeChecklist.options.MEETING_LOCATION')}
                </Typography>
              </Stack>
              <Stack width="$10" />
            </XStack>
          </YStack>
          <Stack position="relative" height={addressFieldHeight}>
            <Stack
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              pointerEvents="none"
            >
              <LinearGradient
                colors={[
                  theme.backgroundPrimary.get(),
                  theme.gradientHelper.get(),
                ]}
                style={{flex: 1}}
              />
            </Stack>
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
        <YStack
          px="$4"
          py="$3"
          borderRadius="$5"
          alignSelf="center"
          backgroundColor="$accentHighlightPrimary"
        >
          <Typography
            variant="description"
            color="$backgroundPrimary"
            textAlign="center"
            lineHeight="100%"
          >
            {selectedLocation.address}
          </Typography>
        </YStack>
      }
      bottomChildren={
        <YStack
          mb="0"
          px="$5"
          pt="$5"
          pb="$5"
          gap="$4"
          backgroundColor="$backgroundPrimary"
          borderRadius="$8"
          borderBottomLeftRadius={0}
          borderBottomRightRadius={0}
        >
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
        </YStack>
      }
      value={selectedLocation}
    />
  )
}

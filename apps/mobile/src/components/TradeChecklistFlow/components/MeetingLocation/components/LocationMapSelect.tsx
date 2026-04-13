import {LocationPlaceId} from '@vexl-next/domain/src/general/offers'
import {type MeetingLocationData} from '@vexl-next/domain/src/general/tradeChecklist'
import {Latitude, Longitude} from '@vexl-next/domain/src/utility/geoCoordinates'
import {type GetGeocodedCoordinatesResponse} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  Button,
  ChevronLeft,
  IconButton,
  SearchBar,
  TextField,
  Typography,
  lightTheme,
} from '@vexl-next/ui'
import {Effect, Schema} from 'effect'
import {LinearGradient} from 'expo-linear-gradient'
import {atom, useAtom, useSetAtom, useStore} from 'jotai'
import React, {useEffect, useMemo, useState} from 'react'
import Animated, {FadeOut} from 'react-native-reanimated'
import {Stack, XStack, YStack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {chatWithMessagesKeys} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {loadingOverlayDisplayedAtom} from '../../../../LoadingOverlayProvider'
import MapLocationSelect from '../../../../Map/components/MapLocationSelect'
import {
  addMeetingLocationActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../../atoms/updatesToBeSentAtom'
import {useWasOpenFromAgreeOnTradeDetailsScreen} from '../../../utils'

type Props = TradeChecklistStackScreenProps<'LocationMapSelect'>

const pragueCenterLocation: MeetingLocationData = {
  placeId: Schema.decodeSync(LocationPlaceId)('prague-default-location'),
  address: 'Prague',
  latitude: Schema.decodeSync(Latitude)(50.0755),
  longitude: Schema.decodeSync(Longitude)(14.4378),
  viewport: {
    northeast: {
      latitude: Schema.decodeSync(Latitude)(50.0955),
      longitude: Schema.decodeSync(Longitude)(14.4578),
    },
    southwest: {
      latitude: Schema.decodeSync(Latitude)(50.0555),
      longitude: Schema.decodeSync(Longitude)(14.4178),
    },
  },
}

const searchBarHeight = 48

export default function LocationMapSelect({
  navigation,
  route,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const showLoadingOverlay = useSetAtom(loadingOverlayDisplayedAtom)
  const submitTradeChecklistUpdates = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const shouldSubmitUpdateOnPick = !useWasOpenFromAgreeOnTradeDetailsScreen()
  const store = useStore()
  const stageMeetingLocation = useSetAtom(addMeetingLocationActionAtom)

  const initialValue = route.params?.selectedLocation ?? pragueCenterLocation
  const noteAtom = useMemo(() => atom(''), [])
  const [note, setNote] = useAtom(noteAtom)
  const [pickedValue, setPickedValue] =
    useState<GetGeocodedCoordinatesResponse | null>(null)
  const [hasMapMoved, setHasMapMoved] = useState(false)

  useEffect(() => {
    setNote(route.params?.selectedLocation?.note ?? '')
  }, [route.params?.selectedLocation?.note, setNote])

  useEffect(() => {
    setPickedValue(null)
    setHasMapMoved(false)
  }, [initialValue])

  function onSubmit(): void {
    if (!pickedValue) return

    stageMeetingLocation({
      ...pickedValue,
      note: note.trim() || undefined,
    })

    if (!shouldSubmitUpdateOnPick) {
      navigation.popTo('AgreeOnTradeDetails')
      return
    }

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

  return (
    <MapLocationSelect
      mapPadding={{top: 220, bottom: 220, left: 0, right: 0}}
      initialValue={initialValue}
      onPick={setPickedValue}
      onMapMoved={() => {
        setHasMapMoved(true)
      }}
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
                  color={lightTheme.accentHighlightSecondary}
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
          <Stack position="relative" height={searchBarHeight}>
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
                  lightTheme.backgroundPrimary,
                  lightTheme.gradientHelper,
                ]}
                style={{flex: 1}}
              />
            </Stack>
            <YStack px="$5">
              <SearchBar
                variant="dummy"
                placeholder={t('common.search')}
                onPress={() => {
                  navigation.navigate('LocationSearch')
                }}
              />
            </YStack>
          </Stack>
        </YStack>
      }
      middleChildren={
        <YStack alignSelf="center" gap="$2" maxWidth="70%">
          {!hasMapMoved ? (
            <Animated.View exiting={FadeOut.duration(180)}>
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
                >
                  {t('map.locationSelect.hint')}
                </Typography>
              </YStack>
            </Animated.View>
          ) : null}
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
            >
              {pickedValue?.address ?? initialValue.address}
            </Typography>
          </YStack>
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
          <TextField
            valueAtom={noteAtom}
            placeholder={`${t('tradeChecklist.location.addNote')}...`}
            showClear
          />
          <Button disabled={!pickedValue} onPress={onSubmit}>
            {t('common.save')}
          </Button>
        </YStack>
      }
    />
  )
}

import {type GetGeocodedCoordinatesResponse} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  Button,
  ChevronLeft,
  IconButton,
  Loader,
  SearchBar,
  TextField,
  Typography,
} from '@vexl-next/ui'
import {LinearGradient} from 'expo-linear-gradient'
import {atom, useAtom, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import Animated, {FadeOut} from 'react-native-reanimated'
import {Stack, XStack, YStack, useTheme} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../../navigationTypes'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import MapLocationSelect from '../../../../Map/components/MapLocationSelect'
import {type GeocodingFailureKind} from '../../../../Map/types'
import {pragueCenterLocation} from '../../../../Map/utils/pragueCenterLocation'
import {addMeetingLocationActionAtom} from '../../../atoms/updatesToBeSentAtom'
import {useTradeChecklistExitNavigation} from '../../../useTradeChecklistExitNavigation'

type Props = TradeChecklistStackScreenProps<'LocationMapSelect'>

const searchBarHeight = 48

export default function LocationMapSelect({
  navigation,
  route,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const tradeChecklistExitNavigation = useTradeChecklistExitNavigation()
  const stageMeetingLocation = useSetAtom(addMeetingLocationActionAtom)

  const initialValue =
    route.params?.selectedLocation ??
    route.params?.initialLocation ??
    pragueCenterLocation
  const noteAtom = useMemo(() => atom(''), [])
  const [note, setNote] = useAtom(noteAtom)
  const [pickedValue, setPickedValue] =
    useState<GetGeocodedCoordinatesResponse | null>(
      route.params?.selectedLocation ?? null
    )
  const [hasMapMoved, setHasMapMoved] = useState(false)
  const [geocodingFailure, setGeocodingFailure] =
    useState<GeocodingFailureKind | null>(null)
  const [isGeocodingInProgress, setIsGeocodingInProgress] = useState(true)

  const handlePick = useCallback(
    (place: GetGeocodedCoordinatesResponse | null) => {
      setPickedValue(place)
      if (place != null) setGeocodingFailure(null)
    },
    []
  )

  useEffect(() => {
    setNote(route.params?.selectedLocation?.note ?? '')
  }, [
    route.params?.initialLocation,
    route.params?.selectedLocation?.note,
    setNote,
  ])

  useEffect(() => {
    setPickedValue(route.params?.selectedLocation ?? null)
    setHasMapMoved(false)
    setGeocodingFailure(null)
  }, [route.params?.selectedLocation, route.params?.initialLocation])

  // A failed re-geocode of a location the user already holds (picked via
  // search or being edited) must not block saving it — only failures for a
  // position the user actually moved to matter.
  const showGeocodingFailure =
    geocodingFailure != null && (hasMapMoved || pickedValue == null)

  function onSubmit(): void {
    if (!pickedValue) return

    stageMeetingLocation({
      ...pickedValue,
      note: note.trim() || undefined,
    })

    tradeChecklistExitNavigation()
  }

  return (
    <MapLocationSelect
      mapPadding={{top: 220, bottom: 220, left: 0, right: 0}}
      initialValue={initialValue}
      onPick={handlePick}
      onGeocodingFailed={setGeocodingFailure}
      onGeocodingInProgressChange={setIsGeocodingInProgress}
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
                  theme.backgroundPrimary.get(),
                  theme.gradientHelper.get(),
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
                  lineHeight="100%"
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
            {isGeocodingInProgress ? (
              <Loader size="small" color={theme.backgroundPrimary.get()} />
            ) : (
              <Typography
                variant="description"
                color={
                  showGeocodingFailure ? '$redForeground' : '$backgroundPrimary'
                }
                textAlign="center"
                lineHeight="100%"
              >
                {showGeocodingFailure
                  ? geocodingFailure === 'serviceError'
                    ? t('tradeChecklist.location.geocodingUnavailable')
                    : t('map.location.errors.notFound')
                  : (pickedValue?.address ?? initialValue.address)}
              </Typography>
            )}
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
          <Button
            disabled={
              !pickedValue || isGeocodingInProgress || showGeocodingFailure
            }
            onPress={onSubmit}
          >
            {t('common.save')}
          </Button>
        </YStack>
      }
    />
  )
}

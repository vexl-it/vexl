import {type GetGeocodedCoordinatesResponse} from '@vexl-next/rest-api/src/services/location/contracts'
import {
  BottomSheetPanel,
  Button,
  ChevronLeft,
  FadeGradient,
  MapLabelPill,
  NavigationBar,
  SearchBar,
  Stack,
  TextField,
  YStack,
} from '@vexl-next/ui'
import {atom, useAtom, useSetAtom} from 'jotai'
import React, {useCallback, useEffect, useMemo, useState} from 'react'
import Animated, {FadeOut} from 'react-native-reanimated'
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
          <YStack backgroundColor="$backgroundPrimary">
            <NavigationBar
              style="back"
              title={t('tradeChecklist.options.MEETING_LOCATION')}
              leftAction={{icon: ChevronLeft, onPress: navigation.goBack}}
            />
          </YStack>
          <Stack position="relative" height={searchBarHeight}>
            <FadeGradient solidEdge="top" />
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
              <MapLabelPill
                variant="highlight"
                label={t('map.locationSelect.hint')}
              />
            </Animated.View>
          ) : null}
          <MapLabelPill
            variant="highlight"
            loading={isGeocodingInProgress}
            error={showGeocodingFailure}
            label={
              showGeocodingFailure
                ? geocodingFailure === 'serviceError'
                  ? t('tradeChecklist.location.geocodingUnavailable')
                  : t('map.location.errors.notFound')
                : (pickedValue?.address ?? initialValue.address)
            }
          />
        </YStack>
      }
      bottomChildren={
        <BottomSheetPanel>
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
        </BottomSheetPanel>
      }
    />
  )
}

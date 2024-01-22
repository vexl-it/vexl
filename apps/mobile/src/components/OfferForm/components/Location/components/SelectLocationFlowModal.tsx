import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {useSetAtom, type PrimitiveAtom} from 'jotai'
import {useEffect, useState} from 'react'
import {Modal} from 'react-native'
import {YStack} from 'tamagui'
import backButtonSvg from '../../../../../images/backButtonSvg'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import randomlyShiftLatLong from '../../../../../utils/randomlyShiftMapValueWithRadius'
import Button from '../../../../Button'
import IconButton from '../../../../IconButton'
import LocationSearch from '../../../../LocationSearch'
import {type LocationSessionId} from '../../../../LocationSearch/molecule'
import {type MapValue, type MapValueWithRadius} from '../../../../Map/brands'
import MapLocationWithRadiusSelect from '../../../../Map/components/MapLocationWithRadiusSelect'
import Screen from '../../../../Screen'
import ScreenTitle from '../../../../ScreenTitle'
import closeSvg from '../../../../images/closeSvg'

interface Props {
  locationSessionId: LocationSessionId
  visible: boolean
  onSetVisible: (visible: boolean) => void
  locationAtom: PrimitiveAtom<OfferLocation[] | undefined>
  randomizeLocation?: boolean
}

export default function SelectLocationFlowModal({
  locationSessionId,
  locationAtom,
  visible,
  randomizeLocation,
  onSetVisible,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const setOfferLocation = useSetAtom(locationAtom)
  const [selectedFromList, setSelectedFromList] = useState<MapValue | null>(
    null
  )
  const [pickedLocation, setPickedLocation] =
    useState<MapValueWithRadius | null>(null)

  useEffect(() => {
    setSelectedFromList(null)
    setPickedLocation(null)
  }, [locationSessionId])

  return (
    <Modal
      animationType="fade"
      visible={visible}
      onRequestClose={() => {
        onSetVisible(false)
      }}
    >
      {!selectedFromList ? (
        <Screen customHorizontalPadding={16}>
          <ScreenTitle text="">
            <IconButton
              variant="dark"
              icon={closeSvg}
              onPress={() => {
                onSetVisible(false)
              }}
            />
          </ScreenTitle>
          <LocationSearch
            onPress={(v) => {
              setSelectedFromList({
                placeId: v.userData.placeId,
                address: `${v.userData.suggestFirstRow}, ${v.userData.suggestSecondRow}`,
                latitude: v.userData.latitude,
                longitude: v.userData.longitude,
                viewport: v.userData.viewport,
              })
            }}
            sessionId={locationSessionId}
          />
        </Screen>
      ) : (
        <MapLocationWithRadiusSelect
          initialValue={selectedFromList}
          onPick={setPickedLocation}
          topChildren={
            <YStack marginVertical="$2" marginHorizontal="$4" space="$4">
              <IconButton
                variant="primary"
                icon={backButtonSvg}
                onPress={() => {
                  setSelectedFromList(null)
                }}
              />
            </YStack>
          }
          bottomChildren={
            <Button
              disabled={!pickedLocation}
              onPress={() => {
                if (!pickedLocation) return

                const latLongToUse = (() => {
                  if (!randomizeLocation) {
                    return {
                      latitude: pickedLocation.latitude,
                      longitude: pickedLocation.longitude,
                    }
                  }
                  return randomlyShiftLatLong({
                    latlong: pickedLocation,
                    maxMeters: 100,
                  })
                })()

                setOfferLocation((prev) => {
                  const newLocation = {
                    placeId: pickedLocation.placeId,
                    address: pickedLocation.address,
                    shortAddress:
                      pickedLocation.address.split(', ')[0] ??
                      pickedLocation.address,
                    radius: pickedLocation.radius,
                    ...latLongToUse,
                  } satisfies OfferLocation

                  return [
                    ...(prev
                      ? prev.filter(
                          (one) => one.placeId !== pickedLocation.placeId
                        )
                      : []),
                    newLocation,
                  ]
                })
                onSetVisible(false)
              }}
              variant="secondary"
              text={t(`common.submit`)}
            />
          }
        />
      )}
    </Modal>
  )
}

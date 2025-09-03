import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {useSetAtom, type PrimitiveAtom} from 'jotai'
import React, {useEffect, useState} from 'react'
import {Modal} from 'react-native'
import {Stack, YStack} from 'tamagui'
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

interface Props {
  locationSessionId: LocationSessionId
  visible: boolean
  onSetVisible: (visible: boolean) => void
  locationAtom: PrimitiveAtom<readonly OfferLocation[] | undefined>
  randomizeLocation?: boolean
}

export default function SelectLocationFlowModal({
  locationSessionId,
  locationAtom,
  visible,
  randomizeLocation,
  onSetVisible,
}: Props): React.ReactElement {
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
          <ScreenTitle
            text=""
            onBackButtonPress={() => {
              onSetVisible(false)
            }}
            withBackButton
          />
          <LocationSearch
            onPress={({locationData}) => {
              setSelectedFromList({
                placeId: locationData.userData.placeId,
                address: `${locationData.userData.suggestFirstRow}, ${locationData.userData.suggestSecondRow}`,
                latitude: locationData.userData.latitude,
                longitude: locationData.userData.longitude,
                viewport: locationData.userData.viewport,
              })
            }}
            sessionId={locationSessionId}
          />
        </Screen>
      ) : (
        <Stack backgroundColor="$black">
          <MapLocationWithRadiusSelect
            initialValue={selectedFromList}
            onPick={setPickedLocation}
            topChildren={
              <YStack marginVertical="$2" marginHorizontal="$4" gap="$4">
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
        </Stack>
      )}
    </Modal>
  )
}

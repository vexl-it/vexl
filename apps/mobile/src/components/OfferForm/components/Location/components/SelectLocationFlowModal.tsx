import {type OfferLocation} from '@vexl-next/domain/src/general/offers'
import {useSetAtom, type PrimitiveAtom} from 'jotai'
import {useState} from 'react'
import {Modal} from 'react-native'
import {YStack} from 'tamagui'
import backButtonSvg from '../../../../../images/backButtonSvg'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Button from '../../../../Button'
import IconButton from '../../../../IconButton'
import LocationSearch from '../../../../LocationSearch'
import {type LocationSessionId} from '../../../../LocationSearch/molecule'
import {type MapValue} from '../../../../Map/brands'
import MapLocationWithRadiusSelect from '../../../../Map/components/MapLocationWithRadiusSelect'
import Screen from '../../../../Screen'
import ScreenTitle from '../../../../ScreenTitle'
import closeSvg from '../../../../images/closeSvg'

interface Props {
  locationSessionId: LocationSessionId
  onLocationPicked: (location: Location) => void
  visible: boolean
  onSetVisible: (visible: boolean) => void
  locationAtom: PrimitiveAtom<OfferLocation[] | undefined>
}

export default function SelectLocationFlowModal({
  locationSessionId,
  locationAtom,
  visible,
  onSetVisible,
}: Props): JSX.Element {
  const {t} = useTranslation()
  const setOfferLocation = useSetAtom(locationAtom)
  const [selectedFromList, setSelectedFromList] = useState<MapValue | null>(
    null
  )

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
          onPick={(value) => {}}
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
              onPress={() => {}}
              variant="secondary"
              text={t(`common.submit`)}
            />
          }
        />
      )}
    </Modal>
  )
}

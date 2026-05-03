import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {ChecklistCell, PinGeolocation} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {tradeChecklistLocationDataAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import * as MeetingLocation from '../../../../../state/tradeChecklist/utils/location'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {tradeChecklistWithUpdatesMergedAtom} from '../../../atoms/updatesToBeSentAtom'
import mapTradeChecklistItemStatusToUiState from './mapTradeChecklistItemStatusToUiState'

function MeetingLocationCell(): React.ReactElement {
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const nextChecklistData = useAtomValue(tradeChecklistWithUpdatesMergedAtom)
  const tradeChecklistLocationData = useAtomValue(
    tradeChecklistLocationDataAtom
  )
  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom('MEETING_LOCATION'), [])
  )

  const onPress = useCallback(() => {
    const existingOwnLocation = nextChecklistData.location.sent?.data
    const lastLocationDataMessage =
      MeetingLocation.getLatestMeetingLocationDataMessage(
        tradeChecklistLocationData
      )
    if (
      lastLocationDataMessage?.by === 'them' &&
      lastLocationDataMessage.status === 'pending'
    ) {
      navigation.navigate('LocationMapPreview', {
        selectedLocation: lastLocationDataMessage.locationData.data,
      })
    } else if (existingOwnLocation) {
      navigation.navigate('LocationMapSelect', {
        selectedLocation: existingOwnLocation,
      })
    } else {
      navigation.navigate('LocationMapSelect')
    }
  }, [
    navigation,
    nextChecklistData.location.sent?.data,
    tradeChecklistLocationData,
  ])

  return (
    <ChecklistCell
      icon={PinGeolocation}
      state={mapTradeChecklistItemStatusToUiState(itemStatus)}
      pressable
      subtitle={MeetingLocation.getSubtitle(nextChecklistData.location)}
      onPress={onPress}
      headline="Set meeting location"
    />
  )
}

export default MeetingLocationCell

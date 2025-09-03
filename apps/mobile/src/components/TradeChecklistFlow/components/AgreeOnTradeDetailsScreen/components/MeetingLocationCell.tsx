import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {tradeChecklistLocationDataAtom} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import * as MeetingLocation from '../../../../../state/tradeChecklist/utils/location'
import {tradeChecklistWithUpdatesMergedAtom} from '../../../atoms/updatesToBeSentAtom'
import ChecklistCell from './ChecklistCell'

function MeetingLocationCell(): React.ReactElement {
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const nextChecklistData = useAtomValue(tradeChecklistWithUpdatesMergedAtom)
  const tradeChecklistLocationData = useAtomValue(
    tradeChecklistLocationDataAtom
  )

  const onPress = useCallback(() => {
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
    } else {
      navigation.navigate('LocationSearch')
    }
  }, [navigation, tradeChecklistLocationData])

  return (
    <ChecklistCell
      item="MEETING_LOCATION"
      subtitle={MeetingLocation.getSubtitle(nextChecklistData.location)}
      onPress={onPress}
    />
  )
}

export default MeetingLocationCell

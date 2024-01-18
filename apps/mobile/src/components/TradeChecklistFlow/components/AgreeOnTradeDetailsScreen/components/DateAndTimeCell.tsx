import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useStore, useAtomValue} from 'jotai'
import {tradeChecklistWithUpdatesMergedAtom} from '../../../atoms/updatesToBeSentAtom'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {useCallback, useMemo} from 'react'
import {
  otherSideDataAtom,
  tradeChecklistDataAtom,
} from '../../../../../state/tradeChecklist/atoms/fromChatAtoms'
import * as DateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import ChecklistCell from './ChecklistCell'

function DateAndTimeCell(): JSX.Element {
  const {t} = useTranslation()
  const store = useStore()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const nextChecklistData = useAtomValue(tradeChecklistWithUpdatesMergedAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)

  const onPress = useCallback(() => {
    const tradeChecklistData = store.get(tradeChecklistDataAtom)

    const receivedSuggestions =
      tradeChecklistData.dateAndTime.received?.suggestions
    if (receivedSuggestions && receivedSuggestions.length > 0) {
      navigation.navigate('PickDateFromSuggestions', {
        chosenDays: receivedSuggestions,
      })
    } else {
      navigation.navigate('ChooseAvailableDays', {
        chosenDays: tradeChecklistData.dateAndTime.sent?.suggestions,
      })
    }
  }, [navigation, store])

  // TODO: check if useMemo is needed here
  const subtitle = useMemo(() => {
    const pick = DateAndTime.getPick(nextChecklistData.dateAndTime)
    if (pick) return DateAndTime.toStringWithTime(pick.pick.dateTime)
    const suggestions = DateAndTime.getSuggestions(
      nextChecklistData.dateAndTime
    )

    if (suggestions)
      return `${t(
        suggestions.by === 'me'
          ? 'tradeChecklist.optionsDetail.DATE_AND_TIME.youAddedTimeOptions'
          : 'tradeChecklist.optionsDetail.DATE_AND_TIME.themAddedTimeOptions',
        {
          them: otherSideData.userName,
          number: suggestions.suggestions.length,
        }
      )}`
  }, [nextChecklistData.dateAndTime, otherSideData.userName, t])

  return (
    <ChecklistCell
      item={'DATE_AND_TIME'}
      onPress={onPress}
      subtitle={subtitle}
    />
  )
}

export default DateAndTimeCell

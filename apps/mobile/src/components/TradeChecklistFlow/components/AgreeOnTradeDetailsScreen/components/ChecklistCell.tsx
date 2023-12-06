import {useNavigation, type NavigationProp} from '@react-navigation/native'
import {useAtomValue, useStore} from 'jotai'
import {useCallback, useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {Stack, Text, XStack, getTokens} from 'tamagui'
import chevronRightSvg from '../../../../../images/chevronRightSvg'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import * as DateAndTime from '../../../../../state/tradeChecklist/utils/dateAndTime'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import Image from '../../../../Image'
import createChecklistItemStatusAtom from '../../../atoms/createChecklistItemStatusAtom'
import {
  otherSideDataAtom,
  tradeChecklistDataAtom,
} from '../../../atoms/fromChatAtoms'
import {type TradeChecklistItem} from '../../../domain'
import StatusIndicator from './StatusIndicator'
import {tradeChecklistWithUpdatesMergedAtom} from '../../../atoms/updatesToBeSentAtom'

interface Props {
  item: TradeChecklistItem
}

// Ideally make cell for every item.
function ChecklistCell({item}: Props): JSX.Element {
  const {t} = useTranslation()
  const store = useStore()
  // not ideal, but there is no other way how to do this with types working
  const nextChecklistData = useAtomValue(tradeChecklistWithUpdatesMergedAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)

  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()

  const itemStatus = useAtomValue(
    useMemo(() => createChecklistItemStatusAtom(item), [item])
  )

  const onPress = useCallback(() => {
    const tradeChecklistData = store.get(tradeChecklistDataAtom)

    if (item === 'DATE_AND_TIME') {
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
    } else if (item === 'CALCULATE_AMOUNT') {
      navigation.navigate('CalculateAmount')
    } else if (item === 'SET_NETWORK') {
      navigation.navigate('Network')
    }
  }, [navigation, item, store])

  // again not ideal (rerenders to much), but there is no way how to do this with types working
  const subtitle = useMemo(() => {
    if (item === 'DATE_AND_TIME') {
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
    }
  }, [item, nextChecklistData.dateAndTime, t, otherSideData.userName])

  return (
    <TouchableOpacity onPress={onPress}>
      <XStack
        ai={'center'}
        jc={'space-between'}
        bc={'$grey'}
        px={'$4'}
        py={'$5'}
        br={'$4'}
      >
        <XStack ai={'center'} space={'$4'}>
          <StatusIndicator itemStatus={itemStatus} />
          <Stack>
            <Text fos={16} ff={'$body500'} col={'$white'}>
              {t(`tradeChecklist.options.${item}`)}
            </Text>
            {subtitle && (
              <Text fos={12} ff={'$body500'} col={'$greyOnBlack'}>
                {subtitle}
              </Text>
            )}
          </Stack>
        </XStack>
        <XStack ai={'center'} space={'$2'}>
          {/* {sideNote && (
            <Text fos={12} ff={'$body500'} col={'$greyOnBlack'}>
              {sideNote}
            </Text>
          )} */}
          <Image
            source={chevronRightSvg}
            stroke={getTokens().color.greyOnBlack.val}
          />
        </XStack>
      </XStack>
    </TouchableOpacity>
  )
}

export default ChecklistCell

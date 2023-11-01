import {Stack, Text} from 'tamagui'
import Image from '../../../../Image'
import anonymousAvatarHappyNoBackgroundSvg from '../../../../images/anonymousAvatarHappyNoBackgroundSvg'
import Info from '../../../../Info'
import TradeRule from './TradeRule'
import ChecklistCell from './ChecklistCell'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtomValue} from 'jotai'
import {useCallback} from 'react'
import {type NavigationProp, useNavigation} from '@react-navigation/native'
import {type TradeChecklistStackParamsList} from '../../../../../navigationTypes'
import {type TradeChecklistItem} from '../../../domain'
import openUrl from '../../../../../utils/openUrl'
import {
  mainTradeCheckListStateAtom,
  offerForTradeChecklistAtom,
} from '../../../atoms'

const tradeChecklistItems: TradeChecklistItem[] = [
  'DATE_AND_TIME',
  'MEETING_LOCATION',
  'CALCULATE_AMOUNT',
  'SET_NETWORK',
  'REVEAL_IDENTITY',
]

const VEXL_BLOG_URL =
  'https://blog.vexl.it/how-to-do-peer-to-peer-trading-on-vexl-6745f3954ae9'

function openVexlBlog(): void {
  openUrl(VEXL_BLOG_URL)()
}

function OnlineOrInPersonTrade(): JSX.Element {
  const {t} = useTranslation()
  const navigation: NavigationProp<TradeChecklistStackParamsList> =
    useNavigation()
  const offerForTradeChecklist = useAtomValue(offerForTradeChecklistAtom)
  const mainTradeCheckListState = useAtomValue(mainTradeCheckListStateAtom)

  const checklistCellOnPress = useCallback(
    (item: TradeChecklistItem) => {
      if (item === 'DATE_AND_TIME') {
        navigation.navigate('ChooseAvailableDays')
      }
    },
    [navigation]
  )

  return (
    <Stack f={1} space={'$3'}>
      <Stack als={'center'}>
        <Image
          height={120}
          width={120}
          source={anonymousAvatarHappyNoBackgroundSvg}
        />
      </Stack>
      <Text textAlign={'center'} ff={'$heading'} fos={32}>
        {t('tradeChecklist.agreeOnTradeDetails')}
      </Text>
      {offerForTradeChecklist?.offerInfo.publicPart.locationState ===
      'ONLINE' ? (
        <>
          <Info
            actionButtonText={t('tradeChecklist.readMoreInFullArticle')}
            hideCloseButton
            text={t('tradeChecklist.thisDealIsFullyOnline')}
            onActionPress={openVexlBlog}
            variant={'yellow'}
          />
          <Stack my={'$4'} gap={'$2'}>
            <TradeRule
              ruleNumber={1}
              title={t('tradeChecklist.tradeOnlyWithPeopleYouKnow')}
            />
            <TradeRule
              ruleNumber={2}
              title={t('tradeChecklist.alwaysMoneyBeforeBtc')}
            />
            <TradeRule
              ruleNumber={3}
              title={t('tradeChecklist.watchOutForSuspiciousBehaviour')}
            />
          </Stack>
        </>
      ) : (
        <>
          <Text
            als={'center'}
            fos={14}
            ff={'$body400'}
            ml={'$2'}
            col={'$greyOnWhite'}
          >
            {t('tradeChecklist.youCanPickWhatYouFill')}
          </Text>
          <Stack my={'$8'} gap={'$2'}>
            {tradeChecklistItems.map((item) => (
              <ChecklistCell
                key={item}
                itemStatus={mainTradeCheckListState[item].status}
                title={t(`tradeChecklist.options.${item}`)}
                onPress={() => {
                  checklistCellOnPress(item)
                }}
                subtitle={
                  item === 'REVEAL_IDENTITY'
                    ? t('tradeChecklist.shareRecognitionSignInChat')
                    : undefined
                }
              />
            ))}
          </Stack>
        </>
      )}
    </Stack>
  )
}

export default OnlineOrInPersonTrade

import {useFocusEffect} from '@react-navigation/native'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack} from 'tamagui'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import {
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../PageWithNavigationHeader'
import headerStateAtom from '../../../PageWithNavigationHeader/state/headerStateAtom'
import {
  areThereUpdatesToBeSentAtom,
  clearUpdatesToBeSentActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../atoms/updatesToBeSentAtom'
import Content from '../Content'
import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'

function AgreeOnTradeDetailsScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const offerForTradeChecklist = useAtomValue(fromChatAtoms.originOfferAtom)
  const areThereUpdatesToBeSent = useAtomValue(areThereUpdatesToBeSentAtom)
  const submitChangesAndSendMessage = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const clearUpdatesToBeSent = useSetAtom(clearUpdatesToBeSentActionAtom)
  const setHeaderState = useSetAtom(headerStateAtom)

  useFocusEffect(
    useCallback(() => {
      setHeaderState((prev) => ({...prev, hidden: true}))
    }, [setHeaderState])
  )

  return (
    <Stack f={1}>
      <Content scrollable>
        <OnlineOrInPersonTrade />
      </Content>
      <PrimaryFooterButtonProxy
        hidden={
          offerForTradeChecklist?.offerInfo.publicPart.locationState ===
          'ONLINE'
        }
        text={t('common.cancel')}
        onPress={() => {
          clearUpdatesToBeSent()
          goBack()
        }}
      />
      <SecondaryFooterButtonProxy
        disabled={
          offerForTradeChecklist?.offerInfo.publicPart.locationState !==
            'ONLINE' && !areThereUpdatesToBeSent
        }
        text={
          offerForTradeChecklist?.offerInfo.publicPart.locationState ===
          'ONLINE'
            ? t('tradeChecklist.acknowledgeAndContinue')
            : t('common.send')
        }
        onPress={() => {
          void submitChangesAndSendMessage()().then((success) => {
            if (success) {
              goBack()
            }
          })
        }}
      />
    </Stack>
  )
}

export default AgreeOnTradeDetailsScreen

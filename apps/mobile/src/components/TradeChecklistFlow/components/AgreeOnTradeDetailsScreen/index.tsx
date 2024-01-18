import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'
import {useAtomValue, useSetAtom} from 'jotai'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../../utils/useSafeGoBack'
import * as fromChatAtoms from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import React, {useCallback} from 'react'
import {useFocusEffect} from '@react-navigation/native'
import headerStateAtom from '../../../PageWithNavigationHeader/state/headerStateAtom'
import {FooterButtonProxy} from '../../../PageWithNavigationHeader'
import Content from '../Content'
import {submitTradeChecklistUpdatesActionAtom} from '../../atoms/updatesToBeSentAtom'

function AgreeOnTradeDetailsScreen(): JSX.Element {
  const {t} = useTranslation()
  const goBack = useSafeGoBack()
  const offerForTradeChecklist = useAtomValue(fromChatAtoms.originOfferAtom)
  const submitChangesAndSendMessage = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const setHeaderState = useSetAtom(headerStateAtom)

  useFocusEffect(
    useCallback(() => {
      setHeaderState((prev) => ({...prev, hidden: true}))
    }, [setHeaderState])
  )

  return (
    <>
      <Content scrollable>
        <OnlineOrInPersonTrade />
      </Content>
      <FooterButtonProxy
        text={
          offerForTradeChecklist?.offerInfo.publicPart.locationState ===
          'ONLINE'
            ? t('tradeChecklist.acknowledgeAndContinue')
            : t('tradeChecklist.saveAndContinue')
        }
        onPress={() => {
          void submitChangesAndSendMessage()().then((success) => {
            if (success) {
              goBack()
            }
          })
        }}
      />
    </>
  )
}

export default AgreeOnTradeDetailsScreen

import {useFocusEffect} from '@react-navigation/native'
import {Effect} from 'effect'
import {isLeft} from 'fp-ts/Either'
import {useAtomValue, useSetAtom, useStore} from 'jotai'
import React, {useCallback, useEffect, useRef} from 'react'
import {Stack} from 'tamagui'
import {type TradeChecklistStackScreenProps} from '../../../../navigationTypes'
import {
  chatWithMessagesKeys,
  originOfferAtom,
} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {andThenExpectBooleanNoErrors} from '../../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {
  PrimaryFooterButtonProxy,
  SecondaryFooterButtonProxy,
} from '../../../PageWithNavigationHeader'
import headerStateAtom from '../../../PageWithNavigationHeader/state/headerStateAtom'
import {revealContactWithUiFeedbackAtom} from '../../atoms/revealContactAtoms'
import {revealIdentityWithUiFeedbackAtom} from '../../atoms/revealIdentityAtoms'
import {
  areThereUpdatesToBeSentAtom,
  askAreYouSureAndClearUpdatesToBeSentActionAtom,
  submitTradeChecklistUpdatesActionAtom,
} from '../../atoms/updatesToBeSentAtom'
import {type AutoOpenTradeChecklistReveal} from '../../domain'
import Content from '../Content'
import OnlineOrInPersonTrade from './components/OnlineOrInPersonTrade'

type Props = TradeChecklistStackScreenProps<'AgreeOnTradeDetails'>

function AgreeOnTradeDetailsScreen({
  navigation,
  route,
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const offerForTradeChecklist = useAtomValue(originOfferAtom)
  const areThereUpdatesToBeSent = useAtomValue(areThereUpdatesToBeSentAtom)
  const submitChangesAndSendMessage = useSetAtom(
    submitTradeChecklistUpdatesActionAtom
  )
  const revealIdentity = useSetAtom(revealIdentityWithUiFeedbackAtom)
  const revealContact = useSetAtom(revealContactWithUiFeedbackAtom)
  const store = useStore()
  const askAreYouSureAndClearUpdatesToBeSent = useSetAtom(
    askAreYouSureAndClearUpdatesToBeSentActionAtom
  )
  const setHeaderState = useSetAtom(headerStateAtom)
  const autoOpenReveal = route.params?.autoOpenReveal
  const handledAutoOpenRevealRef = useRef<
    AutoOpenTradeChecklistReveal | undefined
  >(undefined)

  useFocusEffect(
    useCallback(() => {
      setHeaderState((prev) => ({...prev, hidden: true}))
    }, [setHeaderState])
  )

  useEffect(() => {
    if (!autoOpenReveal || handledAutoOpenRevealRef.current === autoOpenReveal)
      return

    handledAutoOpenRevealRef.current = autoOpenReveal
    const revealToOpen = autoOpenReveal

    async function handleAutoOpenReveal(): Promise<void> {
      const revealResult =
        revealToOpen.item === 'REVEAL_IDENTITY'
          ? await revealIdentity({intent: revealToOpen.intent})()
          : await revealContact({intent: revealToOpen.intent})()

      if (isLeft(revealResult)) return

      await Effect.runPromise(
        andThenExpectBooleanNoErrors((success) => {
          if (success) {
            navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
          }
        })(submitChangesAndSendMessage())
      )
    }

    void handleAutoOpenReveal()
  }, [
    autoOpenReveal,
    navigation,
    revealContact,
    revealIdentity,
    store,
    submitChangesAndSendMessage,
  ])

  return (
    <Stack f={1}>
      <Content scrollable>
        <OnlineOrInPersonTrade />
      </Content>
      <PrimaryFooterButtonProxy
        hidden={
          !!offerForTradeChecklist?.offerInfo.publicPart.locationState.includes(
            'ONLINE'
          ) && !areThereUpdatesToBeSent
        }
        text={t('common.cancel')}
        onPress={() => {
          void askAreYouSureAndClearUpdatesToBeSent()().then((success) => {
            if (success) {
              navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
            }
          })
        }}
      />
      <SecondaryFooterButtonProxy
        disabled={
          !!offerForTradeChecklist?.offerInfo.publicPart.locationState.includes(
            'IN_PERSON'
          ) && !areThereUpdatesToBeSent
        }
        text={
          !!offerForTradeChecklist?.offerInfo.publicPart.locationState.includes(
            'IN_PERSON'
          ) || !!areThereUpdatesToBeSent
            ? t('common.send')
            : t('tradeChecklist.acknowledgeAndContinue')
        }
        onPress={() => {
          void Effect.runPromise(
            andThenExpectBooleanNoErrors((success) => {
              if (success) {
                navigation.popTo('ChatDetail', store.get(chatWithMessagesKeys))
              }
            })(submitChangesAndSendMessage())
          )
        }}
      />
    </Stack>
  )
}

export default AgreeOnTradeDetailsScreen

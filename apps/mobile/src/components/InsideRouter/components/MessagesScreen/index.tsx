import {Effect} from 'effect/index'
import {pipe} from 'fp-ts/function'
import {useSetAtom} from 'jotai'
import React, {useCallback} from 'react'
import {Stack, Text} from 'tamagui'
import {checkAndDeleteEmptyInboxesWithoutOfferAtom} from '../../../../state/chat/atoms/checkAndDeleteEmptyInboxesWithoutOfferAtom'
import fetchMessagesForAllInboxesAtom from '../../../../state/chat/atoms/fetchNewMessagesActionAtom'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useAppState} from '../../../../utils/useAppState'
import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import ChatsList from './components/ChatsList'

function MessagesScreen(): React.ReactElement {
  const {t} = useTranslation()
  const fetchNewMessages = useSetAtom(fetchMessagesForAllInboxesAtom)
  const checkAndDeleteEmptyInboxesWithoutOffer = useSetAtom(
    checkAndDeleteEmptyInboxesWithoutOfferAtom
  )

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active')
          void pipe(
            fetchNewMessages(),
            Effect.andThen(() => checkAndDeleteEmptyInboxesWithoutOffer),
            Effect.runPromise
          )
      },
      [checkAndDeleteEmptyInboxesWithoutOffer, fetchNewMessages]
    )
  )

  return (
    <ContainerWithTopBorderRadius>
      <Stack mx="$4" f={1}>
        <Text ff="$heading" color="$white" fos={32}>
          {t('messages.listTitle')}
        </Text>
        <ChatsList />
      </Stack>
    </ContainerWithTopBorderRadius>
  )
}

export default MessagesScreen

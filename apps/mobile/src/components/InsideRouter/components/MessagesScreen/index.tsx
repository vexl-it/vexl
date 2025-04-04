import {pipe} from 'fp-ts/function'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Stack, Text} from 'tamagui'
import {checkAndDeleteEmptyInboxesWithoutOfferAtom} from '../../../../state/chat/atoms/checkAndDeleteEmptyInboxesWithoutOfferAtom'
import fetchMessagesForAllInboxesAtom from '../../../../state/chat/atoms/fetchNewMessagesActionAtom'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useAppState} from '../../../../utils/useAppState'
import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import ChatsList from './components/ChatsList'

function MessagesScreen(): JSX.Element {
  const {t} = useTranslation()
  const fetchNewMessages = useSetAtom(fetchMessagesForAllInboxesAtom)
  const checkAndDeleteEmptyInboxesWithoutOffer = useSetAtom(
    checkAndDeleteEmptyInboxesWithoutOfferAtom
  )

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active')
          void pipe(fetchNewMessages())().then(
            checkAndDeleteEmptyInboxesWithoutOffer
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

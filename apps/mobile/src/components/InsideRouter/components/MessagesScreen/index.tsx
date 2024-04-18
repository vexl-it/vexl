import {pipe} from 'fp-ts/function'
import {useSetAtom} from 'jotai'
import {useCallback} from 'react'
import {Stack, Text} from 'tamagui'
import fetchMessagesForAllInboxesAtom from '../../../../state/chat/atoms/fetchNewMessagesActionAtom'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {useAppState} from '../../../../utils/useAppState'
import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import Header from '../Header'
import ChatsList from './components/ChatsList'

function MessagesScreen(): JSX.Element {
  const {t} = useTranslation()
  const fetchNewMessages = useSetAtom(fetchMessagesForAllInboxesAtom)

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active') void pipe(fetchNewMessages())()
      },
      [fetchNewMessages]
    )
  )

  return (
    <>
      <Header />
      <ContainerWithTopBorderRadius withTopPadding>
        <Stack mx="$4" f={1}>
          <Text ff="$heading" color="$white" fos={32}>
            {t('messages.listTitle')}
          </Text>
          <ChatsList />
        </Stack>
      </ContainerWithTopBorderRadius>
    </>
  )
}

export default MessagesScreen

import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import {Stack, Text} from 'tamagui'
import useFetchMessagesForAllInboxes from '../../../../state/chat/hooks/useFetchNewMessages'
import {useCallback} from 'react'
import {useAppState} from '../../../../utils/useAppState'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import ChatsList from './components/ChatsList'

function MessagesScreen(): JSX.Element {
  const {t} = useTranslation()
  const fetchNewMessages = useFetchMessagesForAllInboxes()

  useAppState(
    useCallback(
      (state) => {
        if (state === 'active') void fetchNewMessages()()
      },
      [fetchNewMessages]
    )
  )

  return (
    <ContainerWithTopBorderRadius withTopPadding>
      <Stack mx={'$4'} f={1}>
        <Text ff={'$heading'} color={'$white'} fos={32}>
          {t('messages.listTitle')}
        </Text>
        <ChatsList />
      </Stack>
    </ContainerWithTopBorderRadius>
  )
}

export default MessagesScreen

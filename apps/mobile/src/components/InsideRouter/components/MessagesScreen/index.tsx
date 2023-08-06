import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import {Stack, Text} from 'tamagui'
import {useCallback} from 'react'
import {useAppState} from '../../../../utils/useAppState'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import ChatsList from './components/ChatsList'
import {useSetAtom} from 'jotai'
import fetchMessagesForAllInboxesAtom from '../../../../state/chat/hooks/useFetchNewMessages'
import {pipe} from 'fp-ts/function'

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

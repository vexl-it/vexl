import React from 'react'
import {Stack, Text} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import ContainerWithTopBorderRadius from '../ContainerWithTopBorderRadius'
import ChatsList from './components/ChatsList'

function MessagesScreen(): React.ReactElement {
  const {t} = useTranslation()

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

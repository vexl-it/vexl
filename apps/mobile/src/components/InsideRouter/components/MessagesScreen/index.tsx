import React from 'react'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import {InsideScreen} from '../InsideScreen'
import ChatsList from './components/ChatsList'

function MessagesScreen(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <InsideScreen title={t('messages.listTitle')}>
      <ChatsList />
    </InsideScreen>
  )
}

export default MessagesScreen

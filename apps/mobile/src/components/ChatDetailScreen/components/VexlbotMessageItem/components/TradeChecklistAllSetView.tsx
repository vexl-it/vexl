import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistAllSetView(): React.ReactElement | null {
  const {t} = useTranslation()

  return <VexlbotBubble text={t('vexlbot.allSetForTheMeeting')} />
}

export default TradeChecklistAllSetView

import React from 'react'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import VexlbotActionCard from './VexlbotActionCard'

function TradeChecklistAllSetView(): React.ReactElement | null {
  const {t} = useTranslation()

  return <VexlbotActionCard title={t('vexlbot.allSetForTheMeeting')} />
}

export default TradeChecklistAllSetView

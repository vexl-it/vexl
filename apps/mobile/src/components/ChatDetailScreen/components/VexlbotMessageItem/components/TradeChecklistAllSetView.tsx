import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import VexlbotBubble from './VexlbotBubble'

function TradeChecklistAllSetView(): JSX.Element | null {
  const {t} = useTranslation()

  return <VexlbotBubble text={t('vexlbot.allSetForTheMeeting')} />
}

export default TradeChecklistAllSetView

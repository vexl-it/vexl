import {Button} from '@vexl-next/ui'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import UserFeedback from '../../UserFeedback'
import VexlbotActionCard from './VexlbotMessageItem/components/VexlbotActionCard'

export function OtherSideLeftVexlBot(): React.ReactElement {
  const {t} = useTranslation()

  return (
    <>
      <Button>test</Button>
      <VexlbotActionCard>
        <UserFeedback onFinishClose={() => {}} feedbackType="CHAT_RATING" />
      </VexlbotActionCard>
    </>
  )
}

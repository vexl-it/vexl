import {useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {type ChatWithMessages} from '../../../state/chat/domain'
import {canChatBeRequested} from '../../../state/chat/utils/offerStates'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {offerRerequestLimitDaysAtom} from '../../../utils/versionService/atoms'
import InfoSquare from '../../InfoSquare'

function RerequestInfo({
  chat,
}: {
  chat: ChatWithMessages
}): React.ReactElement | null {
  const {t} = useTranslation()
  const rerequestLimitDays = useAtomValue(offerRerequestLimitDaysAtom)

  const rerequestInfo = useMemo(() => {
    return canChatBeRequested(chat, rerequestLimitDays)
  }, [chat, rerequestLimitDays])

  if (rerequestInfo.canBeRerequested) return null

  if (rerequestInfo.possibleInDays === 1)
    return <InfoSquare>{t('offer.rerequestTomorrow')}</InfoSquare>

  return (
    <InfoSquare>
      {t('offer.rerequestDays', {days: rerequestInfo.possibleInDays})}
    </InfoSquare>
  )
}

export default RerequestInfo

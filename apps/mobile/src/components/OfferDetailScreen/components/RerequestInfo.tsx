import {useAtomValue} from 'jotai'
import {offerRerequestLimitDaysAtom} from '../../../utils/remoteConfig/atoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import InfoSquare from '../../InfoSquare'
import React, {useMemo} from 'react'
import {canChatBeRequested} from '../../../state/chat/utils/offerStates'
import {type ChatWithMessages} from '../../../state/chat/domain'

function RerequestInfo({chat}: {chat: ChatWithMessages}): JSX.Element | null {
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

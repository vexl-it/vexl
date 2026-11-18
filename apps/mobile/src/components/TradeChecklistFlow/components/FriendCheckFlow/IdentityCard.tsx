import {PhoneCall, Typography, XStack, YStack, useTheme} from '@vexl-next/ui'
import {useAtomValue} from 'jotai'
import React from 'react'
import {otherSideDataAtom} from '../../../../state/tradeChecklist/atoms/fromChatAtoms'
import {type FriendCheckSubject} from '../../../../state/tradeChecklist/utils/friendCheck'
import {getInternationalPhoneNumber} from '../../../../utils/getInternationalPhoneNumber'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import UserAvatar from '../../../UserAvatar'

const AVATAR_SIZE = 56
const PARTIAL_PHONE_NUMBER = /^(\S+)\s+(\*+)\s+(\S+)$/

function PhoneNumber({
  subject,
}: {
  readonly subject: FriendCheckSubject
}): React.ReactElement {
  const {t} = useTranslation()

  if (subject.fullPhoneNumber)
    return <>{getInternationalPhoneNumber(subject.fullPhoneNumber)}</>

  const partial = subject.partialPhoneNumber?.match(PARTIAL_PHONE_NUMBER)
  if (partial) {
    const [, start, hidden = '', end] = partial
    const dots = '•'.repeat(hidden.length).replace(/(.{3})(?=.)/g, '$1 ')
    return (
      <>
        {start}{' '}
        <Typography variant="paragraphSmall" color="$foregroundTertiary">
          {dots}
        </Typography>{' '}
        {end}
      </>
    )
  }

  if (subject.partialPhoneNumber) return <>{subject.partialPhoneNumber}</>
  return <>{t('tradeChecklist.friendCheck.identity.phoneNumberHidden')}</>
}

export default function IdentityCard({
  subject,
}: {
  readonly subject: FriendCheckSubject
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()
  const otherSideData = useAtomValue(otherSideDataAtom)
  const hasPhoneNumber =
    !!subject.fullPhoneNumber || !!subject.partialPhoneNumber

  return (
    <XStack
      alignItems="center"
      backgroundColor="$backgroundSecondary"
      borderRadius="$5"
      gap="$4"
      padding="$4"
    >
      <UserAvatar
        userImage={otherSideData.image}
        width={AVATAR_SIZE}
        height={AVATAR_SIZE}
      />
      <YStack flex={1} gap="$1">
        <Typography variant="micro" color="$foregroundSecondary">
          {t('tradeChecklist.friendCheck.identity.label')}
        </Typography>
        {subject.nickname ? (
          <Typography variant="titlesSmall" color="$foregroundPrimary">
            {subject.nickname}
          </Typography>
        ) : (
          <Typography variant="paragraphSmallBold" color="$foregroundSecondary">
            {t('tradeChecklist.friendCheck.identity.nicknameHidden')}
          </Typography>
        )}
        <XStack alignItems="center" gap="$2">
          {hasPhoneNumber ? (
            <PhoneCall color={theme.foregroundPrimary.get()} size={16} />
          ) : null}
          <Typography
            variant="paragraphSmall"
            color={
              hasPhoneNumber ? '$foregroundPrimary' : '$foregroundSecondary'
            }
          >
            <PhoneNumber subject={subject} />
          </Typography>
        </XStack>
      </YStack>
    </XStack>
  )
}

import {
  NavButton,
  PeopleUsers,
  Stack,
  Typography,
  useTheme,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtom, useAtomValue} from 'jotai'
import React, {useCallback} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import useSafeGoBack from '../../../utils/useSafeGoBack'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'

function RequestScreenChatHeader(): React.ReactElement {
  const theme = useTheme()
  const safeGoBack = useSafeGoBack()
  const {t} = useTranslation()
  const {
    canSendMessagesAtom,
    commonConnectionsCountAtom,
    forceShowHistoryAtom,
    friendLevelInfoAtom,
    otherSideDataAtom,
    wasDeniedAtom,
    wasCancelledAtom,
    otherSideLeftAtom,
  } = useMolecule(chatMolecule)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const friendLevelInfo = useAtomValue(friendLevelInfoAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const [forceShowHistory, setForceShowHistory] = useAtom(forceShowHistoryAtom)

  const wasDenied = useAtomValue(wasDeniedAtom)
  const wasCancelled = useAtomValue(wasCancelledAtom)

  const onClosePress = useCallback(() => {
    if (forceShowHistory) {
      setForceShowHistory(false)
    } else {
      safeGoBack()
    }
  }, [forceShowHistory, safeGoBack, setForceShowHistory])

  const connectionTitle = friendLevelInfo.includes('FIRST_DEGREE')
    ? t('offer.directFriend')
    : friendLevelInfo.includes('SECOND_DEGREE')
      ? t('offer.friendOfFriend')
      : otherSideData.userName

  return (
    <Stack
      position="relative"
      zIndex={1}
      px="$4"
      pt="$4"
      pb="$7"
      backgroundColor="$backgroundPrimary"
    >
      <XStack alignItems="flex-start" justifyContent="space-between">
        <Stack w="$9" h="$9" />
        <YStack alignItems="center" gap="$2" mt="$2">
          <UserAvatar
            grayScale={wasDenied || wasCancelled}
            userImage={otherSideData.image}
            width={36}
            height={36}
          />
          <Typography
            variant="paragraphDemibold"
            color="$foregroundPrimary"
            textAlign="center"
            numberOfLines={1}
          >
            {connectionTitle}
          </Typography>
          <XStack alignItems="center" gap="$1">
            <PeopleUsers size={16} color={theme.foregroundSecondary.val} />
            <Typography
              variant="description"
              color="$foregroundSecondary"
              textAlign="center"
            >
              {t('offer.numberOfCommon', {number: commonConnectionsCount})}
            </Typography>
          </XStack>
        </YStack>
        <NavButton
          variant="normal"
          icon={XmarkCancelClose}
          onPress={onClosePress}
        />
      </XStack>
    </Stack>
  )
}

export default RequestScreenChatHeader

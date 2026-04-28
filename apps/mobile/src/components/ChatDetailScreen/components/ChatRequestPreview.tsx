import {
  BubbleTip,
  FlagReport,
  Stack,
  tokens,
  Typography,
  useTheme,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {useGetAllClubsForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import CommonFriends from '../../CommonFriends'
import OfferAuthorBanner from '../../OfferAuthorBanner'
import OfferPropertiesCard from '../../OfferPropertiesCard'
import {chatMolecule} from '../atoms'

const bubbleTipSize = tokens.size[7].val
const bubbleTipOffset = tokens.space[5].val
const reportedIconSize = tokens.size[5].val

function ChatRequestPreview(): React.ReactElement {
  const theme = useTheme()
  const {
    offerForChatAtom,
    chatAtom,
    commonConnectionsHashesAtom,
    verifiedConnectionsHashesAtom,
    requestMessageAtom,
    otherSideClubsIdsAtom,
  } = useMolecule(chatMolecule)

  const chat = useAtomValue(chatAtom)
  const offer = useAtomValue(offerForChatAtom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const requestMessage = useAtomValue(requestMessageAtom)
  const otherSideClubs = useGetAllClubsForIds(
    useAtomValue(otherSideClubsIdsAtom) ?? []
  )

  const {t} = useTranslation()

  const isMineOffer = useMemo(() => !!offer?.ownershipInfo?.adminId, [offer])

  const commonFriendsSection = (
    <>
      {!!commonConnectionsHashes &&
        !!offer &&
        commonConnectionsHashes.length > 0 && (
          <Stack>
            <CommonFriends
              commonConnectionsHashes={commonConnectionsHashes}
              verifiedConnectionsHashes={verifiedConnectionsHashes}
              otherSideClubs={otherSideClubs}
            />
          </Stack>
        )}
    </>
  )

  const requestMessageSection = (
    <Stack
      backgroundColor="$backgroundSecondary"
      px="$7"
      py="$6"
      borderRadius="$3"
    >
      <Stack
        pos="absolute"
        top={-bubbleTipOffset}
        left={0}
        right={0}
        alignItems="center"
      >
        <BubbleTip size={bubbleTipSize} color={theme.backgroundSecondary.val} />
      </Stack>
      {requestMessage?.message.text ? (
        <Typography color="$foregroundPrimary" variant="titlesSmall">
          {requestMessage?.message.text}
        </Typography>
      ) : (
        <Typography color="$foregroundSecondary" variant="titlesSmall">
          {t('messages.requestMessageWasDeleted')}
        </Typography>
      )}
    </Stack>
  )

  const reportedOfferSection = (
    <XStack
      borderRadius="$true"
      px="$4"
      py="$4"
      bg="$redBackground"
      gap="$2"
      ai="center"
    >
      <FlagReport color={theme.redForeground.val} size={reportedIconSize} />
      <Typography color="$redForeground" variant="paragraphSmall">
        {t('messages.offerWasReported')}
      </Typography>
    </XStack>
  )

  const offerInfoPreviewSection = (
    <>
      {!!offer && (
        <YStack
          backgroundColor="$backgroundSecondary"
          borderRadius="$5"
          py="$4"
          px="$6"
          gap="$5"
        >
          <OfferAuthorBanner
            offer={offer}
            realUserName={chat.otherSide.realLifeInfo?.userName}
          />
          <OfferPropertiesCard minimalContainer offer={offer} />
        </YStack>
      )}
    </>
  )

  return (
    <YStack gap="$5">
      {!!offer?.flags.reported && reportedOfferSection}
      {requestMessageSection}
      {offerInfoPreviewSection}
      {commonFriendsSection}
    </YStack>
  )
}

export default ChatRequestPreview

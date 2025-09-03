import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import React, {useMemo} from 'react'
import {getTokens, Stack, Text, XStack, YStack} from 'tamagui'
import {useGetAllClubsForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import CommonFriends from '../../CommonFriends'
import Image from '../../Image'
import flagSvg from '../../OfferDetailScreen/images/flagSvg'
import OfferInfoPreview from '../../OfferInfoPreview'
import {chatMolecule} from '../atoms'
import bubbleTypTopSvg from '../images/bubbleTypTopSvg'

function ChatRequestPreview({
  mode,
  showRequestMessage,
}: {
  mode: 'commonFirst' | 'offerFirst'
  showRequestMessage?: boolean
}): React.ReactElement {
  const tokens = getTokens()
  const {
    offerForChatAtom,
    chatAtom,
    commonConnectionsHashesAtom,
    requestMessageAtom,
    otherSideClubsIdsAtom,
  } = useMolecule(chatMolecule)

  const chat = useAtomValue(chatAtom)
  const offer = useAtomValue(offerForChatAtom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
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
          <Stack mx="$-4">
            <CommonFriends
              commonConnectionsHashes={commonConnectionsHashes}
              variant="light"
              otherSideClubs={otherSideClubs}
            />
          </Stack>
        )}
    </>
  )

  const requestMessageSection = (
    <>
      {requestMessage?.message.text ? (
        <Text fos={20} color="$black" fontFamily="$body500">
          {requestMessage?.message.text}
        </Text>
      ) : (
        <Text fos={20} color="$greyOnWhite" fontFamily="$body500">
          {t('messages.requestMessageWasDeleted')}
        </Text>
      )}
    </>
  )

  const offerInfoPreviewSection = (
    <>
      {!!offer?.flags.reported && (
        <XStack
          borderRadius="$true"
          mx="$-4"
          px="$4"
          py="$4"
          bg="$darkRed"
          gap="$2"
        >
          <Image source={flagSvg} stroke={tokens.color.red.val} />
          <Text fos={16} col="$red">
            {t('messages.offerWasReported')}
          </Text>
        </XStack>
      )}
      <Stack
        borderRadius="$true"
        mx="$-4"
        px="$4"
        py="$4"
        backgroundColor="$greyAccent5"
      >
        <Text fontFamily="$body600" mb="$2" fos={14} col="$greyOnWhite">
          {chat.origin.type === 'myOffer'
            ? t('messages.yourOffer')
            : t('messages.theirOffer')}
        </Text>
        {!!offer && (
          <OfferInfoPreview
            onGrayBackground
            isMine={isMineOffer}
            offer={offer.offerInfo}
          />
        )}
      </Stack>
    </>
  )

  return (
    <Stack>
      <Stack pos="absolute" t={-8} l={0} r={0} alignItems="center">
        <Image source={bubbleTypTopSvg} />
      </Stack>
      <YStack
        pos="relative"
        backgroundColor="$white"
        borderRadius="$7"
        pt="$6"
        pb="$2"
        px="$6"
        gap="$4"
      >
        {!!offer?.flags.reported && (
          <XStack
            borderRadius="$true"
            mx="$-4"
            px="$4"
            py="$4"
            bg="$darkRed"
            gap="$2"
          >
            <Image source={flagSvg} stroke={tokens.color.red.val} />
            <Text fos={16} col="$red">
              {t('messages.offerWasReported')}
            </Text>
          </XStack>
        )}
        {!!showRequestMessage && requestMessageSection}
        {mode === 'commonFirst' ? (
          <YStack gap="$4">
            {commonFriendsSection}
            {offerInfoPreviewSection}
          </YStack>
        ) : (
          <Stack gap="$4">
            {offerInfoPreviewSection}
            {commonFriendsSection}
          </Stack>
        )}
      </YStack>
    </Stack>
  )
}

export default ChatRequestPreview

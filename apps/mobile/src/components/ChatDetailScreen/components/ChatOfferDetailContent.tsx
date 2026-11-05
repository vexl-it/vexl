import {useNavigation} from '@react-navigation/native'
import {
  EmptyState,
  FlagReport,
  MenuItem,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React from 'react'
import {useGetAllClubsForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import CommonFriends from '../../CommonFriends'
import OfferAuthorBanner from '../../OfferAuthorBanner'
import {reportOfferActionAtom} from '../../OfferDetailScreen/atoms'
import OfferPropertiesCard from '../../OfferPropertiesCard'
import {chatMolecule} from '../atoms'
import {useCommonFriendsOtherSide} from '../utils/useCommonFriendsOtherSide'

export default function ChatOfferDetailContent({
  chatExists,
}: {
  chatExists: boolean
}): React.ReactElement {
  useStatusBarStyleForScreen('primary')
  const navigation = useNavigation()
  const {t} = useTranslation()
  const otherSide = useCommonFriendsOtherSide()
  const reportOffer = useSetAtom(reportOfferActionAtom)
  const {
    chatAtom,
    commonConnectionsHashesAtom,
    friendLevelInfoAtom,
    isMyChatOriginAtom,
    offerForChatAtom,
    otherSideClubsIdsAtom,
    otherSideDataAtom,
    shouldGrayScaleAvatarAtom,
    theirOfferAndNotReportedAtom,
    verifiedConnectionsHashesAtom,
  } = useMolecule(chatMolecule)

  const chat = useAtomValue(chatAtom)
  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const friendLevel = useAtomValue(friendLevelInfoAtom)
  const isMine = useAtomValue(isMyChatOriginAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const otherSideClubsIds = useAtomValue(otherSideClubsIdsAtom)
  const theirOfferAndNotReported = useAtomValue(theirOfferAndNotReportedAtom)
  const otherSideClubs = useGetAllClubsForIds(otherSideClubsIds ?? [])
  const shouldGrayScaleAvatar = useAtomValue(shouldGrayScaleAvatarAtom)

  if (!chatExists || !offer) {
    return (
      <Screen
        navigationBar={
          <NavigationBar
            style="back"
            title={t('offer.title')}
            rightActions={[
              {
                icon: XmarkCancelClose,
                onPress: () => {
                  navigation.goBack()
                },
              },
            ]}
          />
        }
      >
        <EmptyState
          fullscreen
          title={t('offer.offerNotFound')}
          action={{
            label: t('common.back'),
            onPress: () => {
              navigation.goBack()
            },
            variant: 'primary',
          }}
        />
      </Screen>
    )
  }

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('messages.offerDetail')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: () => {
                navigation.goBack()
              },
            },
          ]}
        />
      }
      scrollable
    >
      <YStack gap="$5" pb="$8">
        <OfferAuthorBanner
          offer={offer}
          realUserName={chat.otherSide.realLifeInfo?.userName}
          userImage={otherSideData.image}
          grayAvatar={shouldGrayScaleAvatar}
          clubIdsForAvatar={otherSideClubsIds ?? []}
        />

        <Typography color="$foregroundPrimary" variant="description">
          {offer.offerInfo.publicPart.offerDescription}
        </Typography>

        <OfferPropertiesCard offer={offer} />

        <CommonFriends
          commonConnectionsHashes={commonConnectionsHashes}
          verifiedConnectionsHashes={verifiedConnectionsHashes}
          otherSideClubs={otherSideClubs}
          friendLevel={friendLevel}
          isMine={isMine}
          otherSide={otherSide}
        />

        {theirOfferAndNotReported ? (
          <MenuItem
            icon={FlagReport}
            variant="danger"
            showChevron={false}
            label={t('messages.reportOffer')}
            onPress={() => {
              void Effect.runPromise(
                andThenExpectBooleanNoErrors((success) => {
                  if (success) {
                    navigation.goBack()
                  }
                })(reportOffer(offer))
              )
            }}
          />
        ) : null}
      </YStack>
    </Screen>
  )
}

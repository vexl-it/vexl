import {useNavigation} from '@react-navigation/native'
import {
  BulletListMenu,
  CommonFriendsSummary,
  DocumentsFiles,
  EmptyState,
  EyeShut,
  FlagReport,
  Menu,
  MenuItem,
  NavigationBar,
  Screen,
  TagLabel,
  TrashBin,
  Typography,
  XStack,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtom, useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {Alert} from 'react-native'
import {type RootStackScreenProps} from '../../../navigationTypes'
import isNoteChatOrigin from '../../../state/chat/utils/isNoteChatOrigin'
import {
  useGetAllClubsForIds,
  useGetAllClubsNamesForIds,
} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {getOtherSideRealNameOrFriendLevel} from '../../../utils/chat/getOtherSideFriendLevel'
import {enableHiddenFeatures} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'
import {useTrustedFriendsText} from '../../../utils/localization/useTrustedFriendsText'
import {isDeveloperAtom} from '../../../utils/preferences'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import CommonFriends from '../../CommonFriends'
import OfferAuthorBanner from '../../OfferAuthorBanner'
import {reportOfferActionAtom} from '../../OfferDetailScreen/atoms'
import {ProfileImageAvatar} from '../../ProfileImageAvatar'
import {chatMolecule} from '../atoms'
import {useCommonFriendsOtherSide} from '../utils/useCommonFriendsOtherSide'
import useOpenExchangeDetails from './useOpenExchangeDetails'

function OtherSideInfoBanner({
  title,
  userImage,
  grayAvatar,
  commonConnectionsCount,
  clubLabel,
  trustedFriends,
}: {
  readonly title: string
  readonly userImage: React.ComponentProps<typeof ProfileImageAvatar>['image']
  readonly grayAvatar: boolean
  readonly commonConnectionsCount: string | number
  readonly clubLabel?: string
  readonly trustedFriends?: string
}): React.ReactElement {
  const {t} = useTranslation()

  return (
    <XStack alignItems="center" gap="$3">
      <ProfileImageAvatar grayscale={grayAvatar} image={userImage} size="$9" />
      <YStack gap="$2" flex={1} minWidth={0}>
        <Typography
          variant="descriptionBold"
          color="$foregroundPrimary"
          numberOfLines={1}
        >
          {title}
        </Typography>
        <CommonFriendsSummary
          clubNames={clubLabel ? [clubLabel] : undefined}
          commonFriends={t('offer.numberOfCommon', {
            number: commonConnectionsCount,
          })}
          trustedFriends={trustedFriends}
        />
      </YStack>
    </XStack>
  )
}

export default function ChatInfoContent({
  chatExists,
}: {
  readonly chatExists: boolean
}): React.ReactElement {
  useStatusBarStyleForScreen('secondary')

  const navigation =
    useNavigation<RootStackScreenProps<'ChatInfo'>['navigation']>()
  const {t} = useTranslation()
  const localizeNumber = useSetAtom(localizedDecimalNumberActionAtom)
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()
  const reportOffer = useSetAtom(reportOfferActionAtom)
  const isDeveloper = useAtomValue(isDeveloperAtom)
  const {
    canSendMessagesAtom,
    chatAtom,
    chatIdAtom,
    commonConnectionsCountAtom,
    trustedConnectionsCountAtom,
    commonConnectionsHashesAtom,
    verifiedConnectionsHashesAtom,
    isMyChatOriginAtom,
    deleteChatWithUiFeedbackAtom,
    friendLevelInfoAtom,
    listingTypeIsOtherAtom,
    offerForChatAtom,
    otherSideClubsIdsAtom,
    otherSideDataAtom,
    otherSideSupportsTradingChecklistAtom,
    publicKeyPemBase64Atom,
    shouldGrayScaleAvatarAtom,
    theirOfferAndNotReportedAtom,
    feedbackSubmittedAtom,
  } = useMolecule(chatMolecule)
  const trustedFriendsText = useTrustedFriendsText(
    useAtomValue(trustedConnectionsCountAtom)
  )
  const otherSide = useCommonFriendsOtherSide()
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const isMine = useAtomValue(isMyChatOriginAtom)
  const chat = useAtomValue(chatAtom)
  const chatId = useAtomValue(chatIdAtom)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const friendLevelInfo = useAtomValue(friendLevelInfoAtom)
  const deleteChatWithUiFeedback = useSetAtom(deleteChatWithUiFeedbackAtom)
  const listingTypeIsOther = useAtomValue(listingTypeIsOtherAtom)
  const offer = useAtomValue(offerForChatAtom)
  const otherSideClubsIds = useAtomValue(otherSideClubsIdsAtom)
  const otherSideClubs = useGetAllClubsForIds(otherSideClubsIds ?? [])
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideSupportsTradingChecklist = useAtomValue(
    otherSideSupportsTradingChecklistAtom
  )
  const [feedbackSubmitted, setFeedbackSubmitted] = useAtom(
    feedbackSubmittedAtom
  )
  const shouldGrayScaleAvatar = useAtomValue(shouldGrayScaleAvatarAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const theirOfferAndNotReported = useAtomValue(theirOfferAndNotReportedAtom)
  const openExchangeDetails = useOpenExchangeDetails()
  const localizedCommonConnectionsCount = localizeNumber({
    number: commonConnectionsCount,
  })
  const showTradeChecklistAction =
    !!otherSideSupportsTradingChecklist &&
    !listingTypeIsOther &&
    !isNoteChatOrigin(chat.origin)
  const showExchangeDetailsAction = useAtomValue(canSendMessagesAtom)
  const showOfferDetailAction = !!offer
  const showReceivedMessagesDebugAction = !!enableHiddenFeatures || isDeveloper
  const otherSideIsOfferCreator =
    offer != null &&
    chat.otherSide.publicKey === offer.offerInfo.publicPart.offerPublicKey
  const otherSideRealUserName = chat.otherSide.realLifeInfo?.userName
  const otherSideClubNames = useGetAllClubsNamesForIds(otherSideClubsIds ?? [])
  const otherSideClubLabel =
    otherSideClubNames.length === 1
      ? otherSideClubNames[0]
      : otherSideClubNames.length > 1
        ? t('clubs.multipleClubs')
        : undefined

  const connectionTitle = useMemo(() => {
    return (
      getOtherSideRealNameOrFriendLevel({
        friendLevel: friendLevelInfo,
        offerInfo: offer?.offerInfo,
        chat,
        t,
      }) ??
      otherSideData.userName ??
      t('offer.title')
    )
  }, [chat, friendLevelInfo, offer, otherSideData.userName, t])

  if (!chatExists) {
    return (
      <Screen
        navigationBar={
          <NavigationBar
            style="back"
            title={t('messages.chatDetail')}
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
          title={t('common.chatNotFoundError')}
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
          title={t('messages.chatDetail')}
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
      <YStack gap="$8" pb="$8">
        <YStack gap="$4">
          {offer != null && otherSideIsOfferCreator ? (
            <OfferAuthorBanner
              offer={offer}
              realUserName={otherSideRealUserName}
              userImage={otherSideData.image}
              grayAvatar={shouldGrayScaleAvatar}
            />
          ) : (
            <OtherSideInfoBanner
              title={connectionTitle}
              userImage={otherSideData.image}
              grayAvatar={shouldGrayScaleAvatar}
              commonConnectionsCount={localizedCommonConnectionsCount}
              clubLabel={otherSideClubLabel}
              trustedFriends={trustedFriendsText}
            />
          )}
          {trustedFriendsText ? (
            <CommonFriends
              commonConnectionsHashes={commonConnectionsHashes}
              verifiedConnectionsHashes={verifiedConnectionsHashes}
              otherSideClubs={otherSideClubs}
              friendLevel={friendLevelInfo}
              isMine={isMine}
              otherSide={otherSide}
            />
          ) : null}
        </YStack>

        <Menu>
          {showTradeChecklistAction ? (
            <MenuItem
              icon={BulletListMenu}
              label={t('messages.tradeChecklist')}
              onPress={() => {
                if (!otherSideSupportsTradingChecklist) {
                  Alert.alert(
                    t('tradeChecklist.notSupportedByOtherSide.title'),
                    t('tradeChecklist.notSupportedByOtherSide.body')
                  )
                  return
                }

                navigation.navigate('TradeChecklistFlow', {
                  screen: 'AgreeOnTradeDetails',
                  chatId,
                  inboxKey,
                })
              }}
            />
          ) : null}
          {showExchangeDetailsAction ? (
            <MenuItem
              icon={EyeShut}
              label={t('tradeChecklist.exchangeDetails.title')}
              onPress={openExchangeDetails}
            />
          ) : null}
          {showOfferDetailAction ? (
            <MenuItem
              icon={DocumentsFiles}
              label={t('messages.offerDetail')}
              onPress={() => {
                navigation.navigate('ChatOfferDetail', {
                  inboxKey,
                  otherSideKey: chat.otherSide.publicKey,
                })
              }}
            />
          ) : null}
          <MenuItem
            icon={TagLabel}
            label={t('messages.tags.action')}
            onPress={() => {
              navigation.navigate('ChatTags', {chatId})
            }}
          />
        </Menu>

        {showReceivedMessagesDebugAction ? (
          <Menu>
            <MenuItem
              icon={DocumentsFiles}
              label="Messages JSON"
              onPress={() => {
                navigation.navigate('ChatReceivedMessagesDebug', {
                  inboxKey,
                  otherSideKey: chat.otherSide.publicKey,
                })
              }}
            />
            <MenuItem
              icon={DocumentsFiles}
              label={
                feedbackSubmitted
                  ? 'set feedback not submitted'
                  : 'set feedback submitted'
              }
              onPress={() => {
                setFeedbackSubmitted((prev) => !prev)
              }}
            />
          </Menu>
        ) : null}

        <Menu>
          <MenuItem
            variant="danger"
            showChevron={false}
            icon={TrashBin}
            label={t('messages.deleteConversation')}
            onPress={() => {
              void Effect.runPromise(
                andThenExpectBooleanNoErrors((success) => {
                  if (success) {
                    resetNavigationToMessagingScreen()
                  }
                })(deleteChatWithUiFeedback({skipAsk: false}))
              )
            }}
          />
          {theirOfferAndNotReported && offer ? (
            <MenuItem
              variant="danger"
              showChevron={false}
              icon={FlagReport}
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
        </Menu>
      </YStack>
    </Screen>
  )
}

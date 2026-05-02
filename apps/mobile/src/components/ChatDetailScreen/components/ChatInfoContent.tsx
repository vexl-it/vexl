import {useNavigation} from '@react-navigation/native'
import {
  BulletListMenu,
  Button,
  ChevronRight,
  Circle,
  DocumentsFiles,
  EyeShut,
  FlagReport,
  NavigationBar,
  PeopleUsers,
  Screen,
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
import {Alert, ScrollView} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, getTokens, useTheme} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {useGetAllClubsNamesForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {getOtherSideRealNameOrFriendLevel} from '../../../utils/chat/getOtherSideFriendLevel'
import {enableHiddenFeatures} from '../../../utils/environment'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'
import {isDeveloperAtom} from '../../../utils/preferences'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import OfferAuthorBanner from '../../OfferAuthorBanner'
import {reportOfferActionAtom} from '../../OfferDetailScreen/atoms'
import {shouldOpenRevealIdentitySummaryAtom} from '../../TradeChecklistFlow/atoms/revealIdentityAtoms'
import UserAvatar from '../../UserAvatar'
import {chatMolecule} from '../atoms'

function SectionSeparator(): React.ReactElement {
  return <Stack height="$0.5" backgroundColor="$backgroundTertiary" ml="$12" />
}

function OtherSideInfoBanner({
  title,
  userImage,
  grayAvatar,
  commonConnectionsCount,
  clubLabel,
}: {
  readonly title: string
  readonly userImage: React.ComponentProps<typeof UserAvatar>['userImage']
  readonly grayAvatar: boolean
  readonly commonConnectionsCount: string | number
  readonly clubLabel?: string
}): React.ReactElement {
  const {t} = useTranslation()
  const theme = useTheme()

  return (
    <XStack alignItems="center" gap="$3">
      <UserAvatar
        grayScale={grayAvatar}
        userImage={userImage}
        width={40}
        height={40}
      />
      <YStack gap="$2" flex={1} minWidth={0}>
        <Typography
          variant="descriptionBold"
          color="$foregroundPrimary"
          numberOfLines={1}
        >
          {title}
        </Typography>
        <XStack gap="$2" alignItems="center">
          {clubLabel != null ? (
            <>
              <Typography
                variant="micro"
                color="$foregroundSecondary"
                numberOfLines={1}
              >
                {clubLabel}
              </Typography>
              <Circle
                size="$2"
                backgroundColor={theme.foregroundSecondary.val}
              />
            </>
          ) : null}
          <XStack gap="$1" alignItems="center">
            <PeopleUsers size={16} color={theme.foregroundSecondary.val} />
            <Typography
              variant="micro"
              color="$foregroundSecondary"
              numberOfLines={1}
            >
              {t('offer.numberOfCommon', {number: commonConnectionsCount})}
            </Typography>
          </XStack>
        </XStack>
      </YStack>
    </XStack>
  )
}

function ActionRow({
  color,
  icon: Icon,
  label,
  showChevron,
  onPress,
}: {
  readonly color: 'foregroundPrimary' | 'redForeground'
  readonly icon: React.ComponentType<{
    readonly color?: string | undefined
    readonly size?: number | undefined
  }>
  readonly label: string
  showChevron?: boolean
  readonly onPress: () => void
}): React.ReactElement {
  const theme = useTheme()
  const tokens = getTokens()
  const iconColor =
    color === 'redForeground'
      ? theme.redForeground.val
      : theme.foregroundSecondary.val
  const textColor =
    color === 'redForeground'
      ? theme.redForeground.val
      : theme.foregroundPrimary.val

  return (
    <XStack
      alignItems="center"
      gap="$4"
      py="$5"
      pressStyle={{opacity: 0.7}}
      onPress={onPress}
    >
      <Icon color={iconColor} size={tokens.size.$7.val} />
      <Typography color={textColor} variant="paragraph">
        {label}
      </Typography>
      {!!showChevron && (
        <Stack flex={1} alignItems="flex-end">
          <ChevronRight
            color={theme.foregroundTertiary.val}
            size={tokens.size.$7.val}
          />
        </Stack>
      )}
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
  const {bottom} = useSafeAreaInsets()
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
    deleteChatWithUiFeedbackAtom,
    friendLevelInfoAtom,
    identityRevealStatusAtom,
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
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const chat = useAtomValue(chatAtom)
  const chatId = useAtomValue(chatIdAtom)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const friendLevelInfo = useAtomValue(friendLevelInfoAtom)
  const deleteChatWithUiFeedback = useSetAtom(deleteChatWithUiFeedbackAtom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const listingTypeIsOther = useAtomValue(listingTypeIsOtherAtom)
  const offer = useAtomValue(offerForChatAtom)
  const otherSideClubsIds = useAtomValue(otherSideClubsIdsAtom)
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
  const shouldOpenRevealIdentitySummary = useAtomValue(
    shouldOpenRevealIdentitySummaryAtom
  )
  const localizedCommonConnectionsCount = localizeNumber({
    number: commonConnectionsCount,
  })
  const showTradeChecklistAction =
    !!otherSideSupportsTradingChecklist && !listingTypeIsOther
  const showRevealIdentityAction =
    canSendMessages && identityRevealStatus === 'notStarted'
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
    if (!offer) return otherSideData.userName ?? t('offer.title')

    return (
      getOtherSideRealNameOrFriendLevel({
        friendLevel: friendLevelInfo,
        offerInfo: offer.offerInfo,
        chat,
        t,
      }) ?? t('offer.title')
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
        <YStack flex={1} justifyContent="center" gap="$5">
          <Text
            color="$foregroundPrimary"
            fontFamily="$body"
            fontSize="$6"
            textAlign="center"
          >
            {t('common.chatNotFoundError')}
          </Text>
          <Button
            onPress={() => {
              navigation.goBack()
            }}
          >
            {t('common.back')}
          </Button>
        </YStack>
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
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottom + getTokens().space.$8.val,
        }}
      >
        <YStack gap="$8">
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
            />
          )}

          {showTradeChecklistAction ||
          showRevealIdentityAction ||
          showOfferDetailAction ? (
            <YStack
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              px="$5"
            >
              {showTradeChecklistAction ? (
                <>
                  <ActionRow
                    showChevron
                    color="foregroundPrimary"
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
                  {showRevealIdentityAction || showOfferDetailAction ? (
                    <SectionSeparator />
                  ) : null}
                </>
              ) : null}

              {showRevealIdentityAction ? (
                <>
                  <ActionRow
                    showChevron
                    color="foregroundPrimary"
                    icon={EyeShut}
                    label={t('messages.askToReveal')}
                    onPress={() => {
                      navigation.navigate('TradeChecklistFlow', {
                        screen: shouldOpenRevealIdentitySummary
                          ? 'RevealIdentitySummary'
                          : 'RevealIdentityPhoto',
                        chatId,
                        inboxKey,
                      })
                    }}
                  />
                  {showOfferDetailAction ? <SectionSeparator /> : null}
                </>
              ) : null}

              {showOfferDetailAction ? (
                <ActionRow
                  showChevron
                  color="foregroundPrimary"
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
            </YStack>
          ) : null}

          {showReceivedMessagesDebugAction ? (
            <YStack
              backgroundColor="$backgroundSecondary"
              borderRadius="$5"
              px="$5"
            >
              <ActionRow
                showChevron
                color="foregroundPrimary"
                icon={DocumentsFiles}
                label="Messages JSON"
                onPress={() => {
                  navigation.navigate('ChatReceivedMessagesDebug', {
                    inboxKey,
                    otherSideKey: chat.otherSide.publicKey,
                  })
                }}
              />
              <ActionRow
                showChevron
                color="foregroundPrimary"
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
            </YStack>
          ) : null}

          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$5"
            px="$5"
          >
            <ActionRow
              color="redForeground"
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
            {theirOfferAndNotReported && offer ? <SectionSeparator /> : null}
            {theirOfferAndNotReported && offer ? (
              <>
                <ActionRow
                  color="redForeground"
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
              </>
            ) : null}
          </YStack>
        </YStack>
      </ScrollView>
    </Screen>
  )
}

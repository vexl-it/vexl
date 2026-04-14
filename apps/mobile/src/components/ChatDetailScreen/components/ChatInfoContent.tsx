import {useNavigation} from '@react-navigation/native'
import {
  BulletListMenu,
  Button,
  ChevronRight,
  DocumentsFiles,
  EyeShut,
  FlagReport,
  NavigationBar,
  Screen,
  TrashBin,
  Typography,
  XStack,
  XmarkCancelClose,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {Alert, ScrollView} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {Stack, Text, getTokens, useTheme} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {getChatDisplayName} from '../../../utils/chat/getChatDisplayName'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'
import useResetNavigationToMessagingScreen from '../../../utils/useResetNavigationToMessagingScreen'
import {reportOfferActionAtom} from '../../OfferDetailScreen/atoms'
import {shouldOpenRevealIdentitySummaryAtom} from '../../TradeChecklistFlow/atoms/revealIdentityAtoms'
import {chatMolecule} from '../atoms'
import ChatConnectionHeader, {type TradeTagData} from './ChatConnectionHeader'

function getIconTagVariant(
  listingType: 'BITCOIN' | 'OTHER' | 'PRODUCT' | undefined
): 'bitcoin' | 'product' | 'service' {
  if (listingType === 'PRODUCT') return 'product'
  if (listingType === 'OTHER') return 'service'
  return 'bitcoin'
}

function getIsOffering(
  listingType: 'BITCOIN' | 'OTHER' | 'PRODUCT' | undefined,
  offerType: 'BUY' | 'SELL'
): boolean {
  if (!listingType || listingType === 'BITCOIN') {
    return offerType === 'SELL'
  }

  return offerType === 'BUY'
}

function SectionSeparator(): React.ReactElement {
  return <Stack height="$0.5" backgroundColor="$backgroundTertiary" ml="$12" />
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
  const theme = useTheme()
  const {t} = useTranslation()
  const localizeNumber = useSetAtom(localizedDecimalNumberActionAtom)
  const resetNavigationToMessagingScreen = useResetNavigationToMessagingScreen()
  const reportOffer = useSetAtom(reportOfferActionAtom)
  const {
    canSendMessagesAtom,
    chatAtom,
    chatIdAtom,
    commonConnectionsCountAtom,
    deleteChatWithUiFeedbackAtom,
    identityRevealStatusAtom,
    listingTypeIsOtherAtom,
    offerForChatAtom,
    otherSideDataAtom,
    otherSideLeftAtom,
    otherSideSupportsTradingChecklistAtom,
    publicKeyPemBase64Atom,
    theirOfferAndNotReportedAtom,
  } = useMolecule(chatMolecule)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const chat = useAtomValue(chatAtom)
  const chatId = useAtomValue(chatIdAtom)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const deleteChatWithUiFeedback = useSetAtom(deleteChatWithUiFeedbackAtom)
  const identityRevealStatus = useAtomValue(identityRevealStatusAtom)
  const listingTypeIsOther = useAtomValue(listingTypeIsOtherAtom)
  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)
  const otherSideSupportsTradingChecklist = useAtomValue(
    otherSideSupportsTradingChecklistAtom
  )
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

  const connectionTitle = useMemo(() => {
    if (!offer) return otherSideData.userName ?? t('offer.title')

    if (offer.offerInfo.privatePart.friendLevel.includes('FIRST_DEGREE')) {
      return t('offer.directFriend')
    }

    if (offer.offerInfo.privatePart.friendLevel.includes('SECOND_DEGREE')) {
      return t('offer.friendOfFriend')
    }

    return (
      getChatDisplayName({
        offerInfo: offer.offerInfo,
        userName: otherSideData.userName,
        t,
      }) ?? t('offer.title')
    )
  }, [offer, otherSideData.userName, t])

  const tradeTag = useMemo((): TradeTagData | null => {
    if (!offer) return null

    const listingType = offer.offerInfo.publicPart.listingType
    const isOffering = offer.ownershipInfo
      ? !getIsOffering(listingType, offer.offerInfo.publicPart.offerType)
      : getIsOffering(listingType, offer.offerInfo.publicPart.offerType)

    return {
      iconVariant: getIconTagVariant(listingType),
      label: isOffering ? t('offer.title') : t('common.request'),
      variant: isOffering ? 'offer' : 'request',
    }
  }, [offer, t])

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
          <ChatConnectionHeader
            canSendMessages={canSendMessages}
            commonConnectionsLabel={t('offer.numberOfCommon', {
              number: localizedCommonConnectionsCount,
            })}
            connectionTitle={connectionTitle}
            otherSideLeft={otherSideLeft}
            tradeTag={tradeTag}
            userImage={otherSideData.image}
          />

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

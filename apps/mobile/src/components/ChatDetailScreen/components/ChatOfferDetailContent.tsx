import {useNavigation} from '@react-navigation/native'
import {
  Button,
  FlagReport,
  NavigationBar,
  Screen,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Effect, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useMemo} from 'react'
import {ScrollView} from 'react-native'
import {useSafeAreaInsets} from 'react-native-safe-area-context'
import {getTokens, Stack, useTheme} from 'tamagui'
import {useGetAllClubsForIds} from '../../../state/clubs/atom/clubsWithMembersAtom'
import {useStatusBarStyleForScreen} from '../../../state/statusBarStyleAtom'
import {andThenExpectBooleanNoErrors} from '../../../utils/andThenExpectNoErrors'
import {bigNumberToString} from '../../../utils/bigNumberToString'
import {getChatDisplayName} from '../../../utils/chat/getChatDisplayName'
import {formatCurrencyAmount} from '../../../utils/localization/currency'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {localizedDecimalNumberActionAtom} from '../../../utils/localization/localizedNumbersAtoms'
import spokenLanguageToFlagEmoji from '../../../utils/localization/spokenLanguageToFlagEmoji'
import CommonFriends from '../../CommonFriends'
import {reportOfferActionAtom} from '../../OfferDetailScreen/atoms'
import {chatMolecule} from '../atoms'
import ChatConnectionHeader from './ChatConnectionHeader'

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

function getTradeTagVariant(isOffering: boolean): 'offer' | 'request' {
  return isOffering ? 'offer' : 'request'
}

export default function ChatOfferDetailContent({
  chatExists,
}: {
  chatExists: boolean
}): React.ReactElement {
  useStatusBarStyleForScreen('primary')
  const navigation = useNavigation()
  const theme = useTheme()
  const {bottom} = useSafeAreaInsets()
  const {t} = useTranslation()
  const localizeNumber = useSetAtom(localizedDecimalNumberActionAtom)
  const reportOffer = useSetAtom(reportOfferActionAtom)
  const {
    canSendMessagesAtom,
    commonConnectionsCountAtom,
    commonConnectionsHashesAtom,
    offerForChatAtom,
    otherSideClubsIdsAtom,
    otherSideDataAtom,
    otherSideLeftAtom,
    theirOfferAndNotReportedAtom,
    verifiedConnectionsHashesAtom,
  } = useMolecule(chatMolecule)

  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)
  const canSendMessages = useAtomValue(canSendMessagesAtom)
  const otherSideLeft = useAtomValue(otherSideLeftAtom)
  const commonConnectionsCount = useAtomValue(commonConnectionsCountAtom)
  const commonConnectionsHashes = useAtomValue(commonConnectionsHashesAtom)
  const verifiedConnectionsHashes = useAtomValue(verifiedConnectionsHashesAtom)
  const otherSideClubsIds = useAtomValue(otherSideClubsIdsAtom)
  const theirOfferAndNotReported = useAtomValue(theirOfferAndNotReportedAtom)
  const otherSideClubs = useGetAllClubsForIds(otherSideClubsIds ?? [])

  const localizedCommonConnectionsCount = localizeNumber({
    number: commonConnectionsCount,
  })

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

  const tradeTag = useMemo(() => {
    if (!offer) return null

    const listingType = offer.offerInfo.publicPart.listingType
    const isOffering = offer.ownershipInfo
      ? !getIsOffering(listingType, offer.offerInfo.publicPart.offerType)
      : getIsOffering(listingType, offer.offerInfo.publicPart.offerType)

    return {
      iconVariant: getIconTagVariant(listingType),
      label: isOffering ? t('offer.title') : t('common.request'),
      variant: getTradeTagVariant(isOffering),
    }
  }, [offer, t])

  const detailRows = useMemo(() => {
    if (!offer) return []

    const {publicPart} = offer.offerInfo

    const amount =
      publicPart.amountBottomLimit > 0
        ? `${bigNumberToString(publicPart.amountBottomLimit)} - ${formatCurrencyAmount(
            publicPart.currency,
            publicPart.amountTopLimit
          )}`
        : formatCurrencyAmount(publicPart.currency, publicPart.amountTopLimit)

    const location =
      publicPart.location[0]?.shortAddress ??
      publicPart.location[0]?.address ??
      t('offer.online')

    const paymentMethod = pipe(
      [
        ...pipe(
          publicPart.paymentMethod,
          Array.map((method) => {
            if (method === 'CASH') return t('offerForm.paymentMethod.cash')
            if (method === 'BANK') return t('offerForm.paymentMethod.bank')
            return t('offerForm.paymentMethod.revolut')
          })
        ),
        ...pipe(
          publicPart.btcNetwork,
          Array.map((network) =>
            network === 'ON_CHAIN'
              ? t('offerForm.network.onChain')
              : t('offerForm.network.lightning')
          )
        ),
      ],
      Array.join(' • ')
    )

    const languages = pipe(
      publicPart.spokenLanguages,
      Array.map(spokenLanguageToFlagEmoji),
      Array.join(' ')
    )

    return pipe(
      [
        {
          key: 'amount',
          label: t('offerForm.amountOfTransaction.amountOfTransaction'),
          value: amount,
        },
        {
          key: 'location',
          label: t('offerForm.location.location'),
          value: location,
        },
        {
          key: 'paymentMethod',
          label: t('offerForm.paymentMethod.paymentMethod'),
          value: paymentMethod,
        },
        {
          key: 'languages',
          label: t('offerForm.spokenLanguages.preferredLanguages'),
          value: languages,
        },
      ],
      Array.filter((row) => row.value.length > 0)
    )
  }, [offer, t])

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
        <YStack flex={1} justifyContent="center" gap="$5">
          <Typography
            color="$foregroundPrimary"
            textAlign="center"
            variant="paragraph"
          >
            {t('offer.offerNotFound')}
          </Typography>
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
    >
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: bottom + getTokens().space.$8.val,
        }}
      >
        <YStack gap="$5">
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

          <Typography color="$foregroundPrimary" variant="description">
            {offer.offerInfo.publicPart.offerDescription}
          </Typography>

          <YStack
            backgroundColor="$backgroundSecondary"
            borderRadius="$5"
            p="$4"
            gap="$6"
          >
            {detailRows.map((row) => (
              <XStack
                key={row.key}
                alignItems="flex-start"
                justifyContent="space-between"
                gap="$4"
              >
                <Typography color="$foregroundSecondary" variant="micro">
                  {row.label}
                </Typography>
                <Typography
                  color="$foregroundPrimary"
                  flex={1}
                  textAlign="right"
                  variant="descriptionBold"
                >
                  {row.value}
                </Typography>
              </XStack>
            ))}
          </YStack>

          <CommonFriends
            commonConnectionsHashes={commonConnectionsHashes}
            verifiedConnectionsHashes={verifiedConnectionsHashes}
            otherSideClubs={otherSideClubs}
          />

          {theirOfferAndNotReported ? (
            <Stack position="relative">
              <Button
                backgroundColor="$backgroundSecondary"
                onPress={() => {
                  void Effect.runPromise(
                    andThenExpectBooleanNoErrors((success) => {
                      if (success) {
                        navigation.goBack()
                      }
                    })(reportOffer(offer))
                  )
                }}
              >
                {' '}
              </Button>
              <XStack
                alignItems="center"
                gap="$3"
                position="absolute"
                top={0}
                right="$5"
                bottom={0}
                left="$5"
                pointerEvents="none"
              >
                <FlagReport
                  color={theme.redForeground.val}
                  size={getTokens().size.$7.val}
                />
                <Typography color="$redForeground" variant="paragraph">
                  {t('messages.reportOffer')}
                </Typography>
              </XStack>
            </Stack>
          ) : null}
        </YStack>
      </ScrollView>
    </Screen>
  )
}

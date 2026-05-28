import {useNavigation} from '@react-navigation/native'
import {
  NavButton,
  Typography,
  XmarkCancelClose,
  XStack,
  YStack,
} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type GestureResponderEvent} from 'react-native'
import {Stack} from 'tamagui'
import {type RootStackScreenProps} from '../../../navigationTypes'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatCurrencyAmount} from '../../../utils/localization/currency'
import {chatMolecule} from '../atoms'

function getOfferTitleKey({
  isMineOffer,
  listingType,
  offerType,
}: {
  isMineOffer: boolean
  listingType: 'BITCOIN' | 'PRODUCT' | 'OTHER'
  offerType: 'BUY' | 'SELL'
}):
  | 'chatDetail.offerTitle.mine.buyBitcoin'
  | 'chatDetail.offerTitle.mine.sellBitcoin'
  | 'chatDetail.offerTitle.mine.buyProduct'
  | 'chatDetail.offerTitle.mine.sellProduct'
  | 'chatDetail.offerTitle.mine.buyOther'
  | 'chatDetail.offerTitle.mine.sellOther'
  | 'chatDetail.offerTitle.theirs.buyBitcoin'
  | 'chatDetail.offerTitle.theirs.sellBitcoin'
  | 'chatDetail.offerTitle.theirs.buyProduct'
  | 'chatDetail.offerTitle.theirs.sellProduct'
  | 'chatDetail.offerTitle.theirs.buyOther'
  | 'chatDetail.offerTitle.theirs.sellOther' {
  if (isMineOffer) {
    if (offerType === 'BUY') {
      if (listingType === 'PRODUCT')
        return 'chatDetail.offerTitle.mine.buyProduct'
      if (listingType === 'OTHER') return 'chatDetail.offerTitle.mine.buyOther'
      return 'chatDetail.offerTitle.mine.buyBitcoin'
    }

    if (listingType === 'PRODUCT')
      return 'chatDetail.offerTitle.mine.sellProduct'
    if (listingType === 'OTHER') return 'chatDetail.offerTitle.mine.sellOther'
    return 'chatDetail.offerTitle.mine.sellBitcoin'
  }

  if (offerType === 'BUY') {
    if (listingType === 'PRODUCT')
      return 'chatDetail.offerTitle.theirs.buyProduct'
    if (listingType === 'OTHER') return 'chatDetail.offerTitle.theirs.buyOther'
    return 'chatDetail.offerTitle.theirs.buyBitcoin'
  }

  if (listingType === 'PRODUCT')
    return 'chatDetail.offerTitle.theirs.sellProduct'
  if (listingType === 'OTHER') return 'chatDetail.offerTitle.theirs.sellOther'
  return 'chatDetail.offerTitle.theirs.sellBitcoin'
}

const languageToFlagMap: Record<string, string> = {
  BG: 'BG',
  CZE: 'CZ',
  DEU: 'DE',
  ENG: 'GB',
  ESP: 'ES',
  FAS: 'IR',
  FRA: 'FR',
  ITA: 'IT',
  PRT: 'PT',
  SVK: 'SK',
}

function countryCodeToFlagEmoji(countryCode: string): string {
  return String.fromCodePoint(
    ...countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0))
  )
}

function StickyHeader(): React.ReactElement | null {
  const {t} = useTranslation()
  const navigation =
    useNavigation<RootStackScreenProps<'ChatDetail'>['navigation']>()
  const {chatAtom, offerForChatAtom, publicKeyPemBase64Atom, showInfoBarAtom} =
    useMolecule(chatMolecule)
  const chat = useAtomValue(chatAtom)
  const offer = useAtomValue(offerForChatAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const showInfoBar = useAtomValue(showInfoBarAtom)
  const setShowInfoBar = useSetAtom(showInfoBarAtom)

  const openOfferDetail = useCallback(() => {
    navigation.navigate('ChatOfferDetail', {
      inboxKey,
      otherSideKey: chat.otherSide.publicKey,
    })
  }, [chat.otherSide.publicKey, inboxKey, navigation])

  const hideStickyHeader = useCallback(
    (event: GestureResponderEvent) => {
      event.stopPropagation()
      setShowInfoBar(false)
    },
    [setShowInfoBar]
  )

  const offerTitle = useMemo(() => {
    if (!offer || chat.origin.type === 'unknown') return null

    const listingType = offer.offerInfo.publicPart.listingType ?? 'BITCOIN'

    return t(
      getOfferTitleKey({
        isMineOffer: !!offer.ownershipInfo?.adminId,
        listingType,
        offerType: offer.offerInfo.publicPart.offerType,
      })
    )
  }, [chat.origin.type, offer, t])

  const offerAmount = useMemo(() => {
    if (!offer) return null

    return formatCurrencyAmount(
      offer.offerInfo.publicPart.currency,
      offer.offerInfo.publicPart.amountTopLimit
    )
  }, [offer])

  const offerLocationTypeText = useMemo(() => {
    if (!offer) return null

    return offer.offerInfo.publicPart.locationState.includes('IN_PERSON')
      ? t('offer.cash')
      : t('offer.online')
  }, [offer, t])

  const offerCity = useMemo(() => {
    if (!offer) return null

    return offer.offerInfo.publicPart.location[0]?.shortAddress ?? null
  }, [offer])

  const offerLanguageFlags = useMemo(() => {
    if (!offer) return []

    const result: string[] = []

    for (const language of offer.offerInfo.publicPart.spokenLanguages) {
      const countryCode = languageToFlagMap[language]

      if (countryCode) {
        result.push(countryCodeToFlagEmoji(countryCode))
      }
    }

    return result
  }, [offer])

  const offerMetadata = useMemo(() => {
    const result: Array<{key: string; text: string}> = []

    if (offerAmount) {
      result.push({key: 'amount', text: `${t('offer.upTo')} ${offerAmount}`})
    }
    if (offerLocationTypeText) {
      result.push({key: 'locationType', text: offerLocationTypeText})
    }
    if (offerCity) {
      result.push({key: 'city', text: offerCity})
    }
    if (offerLanguageFlags.length > 0) {
      result.push({key: 'languages', text: ''})
    }

    return result
  }, [offerAmount, offerCity, offerLanguageFlags, offerLocationTypeText, t])

  if (!offer || !showInfoBar) return null
  return (
    <XStack
      justifyContent="space-between"
      alignItems="center"
      py="$4"
      px="$5"
      backgroundColor="$backgroundSecondary"
      onPress={openOfferDetail}
    >
      <YStack flex={1} gap="$2">
        {offerTitle ? (
          <XStack alignItems="center" flexWrap="wrap">
            <Typography color="$foregroundPrimary" variant="paragraphSmallBold">
              {offerTitle}
            </Typography>
          </XStack>
        ) : null}
        <XStack alignItems="center" gap="$2" flexWrap="wrap">
          {offerMetadata.map((item, index) => {
            if (item.key === 'languages') {
              return (
                <React.Fragment key={item.key}>
                  {index > 0 ? (
                    <Typography
                      color="$foregroundSecondary"
                      variant="description"
                    >
                      •
                    </Typography>
                  ) : null}
                  {offerLanguageFlags.map((flag, flagIndex) => (
                    <Typography
                      key={`${flag}-${flagIndex}`}
                      color="$foregroundSecondary"
                      variant="description"
                    >
                      {flag}
                    </Typography>
                  ))}
                </React.Fragment>
              )
            }

            return (
              <XStack
                key={item.key}
                alignItems="center"
                gap="$2"
                flexShrink={1}
              >
                {index > 0 ? (
                  <Typography
                    color="$foregroundSecondary"
                    variant="description"
                  >
                    •
                  </Typography>
                ) : null}
                <Typography color="$foregroundSecondary" variant="description">
                  {item.text}
                </Typography>
              </XStack>
            )
          })}
        </XStack>
      </YStack>
      <Stack>
        <NavButton
          variant="tetriary"
          icon={XmarkCancelClose}
          onPress={hideStickyHeader}
        />
      </Stack>
    </XStack>
  )
}

export default StickyHeader

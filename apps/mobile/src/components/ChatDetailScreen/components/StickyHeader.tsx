import {useNavigation} from '@react-navigation/native'
import {ChatContextBar, InfoCircle, XmarkCancelClose} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {Array, Option, pipe} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {type GestureResponderEvent} from 'react-native'
import {type RootStackScreenProps} from '../../../navigationTypes'
import isNoteChatOrigin from '../../../state/chat/utils/isNoteChatOrigin'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {formatFullCurrencyAmount} from '../../../utils/localization/currency'
import {formattingLocaleAtom} from '../../../utils/localization/formattingLocaleAtom'
import {offerLocationLabelsAtom} from '../../../utils/offerLocationLabelsAtom'
import {getUserFacingOfferType} from '../../../utils/offerTypeSemantics'
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
  const {
    chatAtom,
    offerForChatAtom,
    noteForChatAtom,
    publicKeyPemBase64Atom,
    showInfoBarAtom,
  } = useMolecule(chatMolecule)
  const chat = useAtomValue(chatAtom)
  const offer = useAtomValue(offerForChatAtom)
  const note = useAtomValue(noteForChatAtom)
  const inboxKey = useAtomValue(publicKeyPemBase64Atom)
  const showInfoBar = useAtomValue(showInfoBarAtom)
  const currentLocale = useAtomValue(formattingLocaleAtom)
  const {getCompactLabelForLocations} = useAtomValue(offerLocationLabelsAtom)
  const setShowInfoBar = useSetAtom(showInfoBarAtom)

  const openOfferDetail = useCallback(() => {
    navigation.navigate('ChatOfferDetail', {
      inboxKey,
      otherSideKey: chat.otherSide.publicKey,
    })
  }, [chat.otherSide.publicKey, inboxKey, navigation])

  const isNoteOrigin = isNoteChatOrigin(chat.origin)

  const openNoteDetail = useCallback(() => {
    navigation.navigate('ChatNoteDetail', {
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
        offerType: getUserFacingOfferType({
          listingType,
          offerType: offer.offerInfo.publicPart.offerType,
        }),
      })
    )
  }, [chat.origin.type, offer, t])

  const offerAmount = useMemo(() => {
    if (!offer) return null

    return formatFullCurrencyAmount(
      offer.offerInfo.publicPart.currency,
      offer.offerInfo.publicPart.amountTopLimit,
      currentLocale
    )
  }, [currentLocale, offer])

  const offerLocationTypeText = useMemo(() => {
    if (!offer) return null

    return offer.offerInfo.publicPart.locationState.includes('IN_PERSON')
      ? t('offer.cash')
      : t('offer.online')
  }, [offer, t])

  const offerCity = useMemo(() => {
    if (!offer) return null

    return getCompactLabelForLocations(offer.offerInfo.publicPart.location)
  }, [getCompactLabelForLocations, offer])

  const offerLanguageFlags = useMemo(() => {
    if (!offer) return null

    return pipe(
      offer.offerInfo.publicPart.spokenLanguages,
      Array.filterMap((language) =>
        Option.fromNullable(languageToFlagMap[language])
      ),
      Array.map(countryCodeToFlagEmoji),
      Array.join(' ')
    )
  }, [offer])

  const offerMetadata = useMemo(
    () =>
      pipe(
        [
          offerAmount ? `${t('offer.upTo')} ${offerAmount}` : null,
          offerLocationTypeText,
          offerCity,
          offerLanguageFlags,
        ],
        Array.filter((item): item is string => !!item)
      ),
    [offerAmount, offerCity, offerLanguageFlags, offerLocationTypeText, t]
  )

  if (isNoteOrigin) {
    if (!note || !showInfoBar) return null

    return (
      <ChatContextBar
        title={
          chat.origin.type === 'myNote'
            ? t('notes.chat.usersResponseToNote')
            : t('notes.chat.yourResponseToNote')
        }
        subtitle={note.noteInfo.publicPart.text}
        actionIcon={InfoCircle}
        onActionPress={openNoteDetail}
        onPress={openNoteDetail}
      />
    )
  }

  if (!offer || !showInfoBar) return null
  return (
    <ChatContextBar
      title={offerTitle ?? undefined}
      meta={offerMetadata}
      actionIcon={XmarkCancelClose}
      onActionPress={hideStickyHeader}
      onPress={openOfferDetail}
    />
  )
}

export default StickyHeader

import {useNavigation, useRoute} from '@react-navigation/native'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {Option} from 'effect'
import {useAtomValue, type Atom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {Stack} from 'tamagui'
import {chatWithMessagesForOfferAtom} from '../../state/chat/hooks/useChatForOffer'
import {
  canChatBeRequested,
  getRequestState,
} from '../../state/chat/utils/offerStates'
import {marketplaceFirstOfferBannerAtom} from '../../state/marketplace/atoms/offerSuggestionVisible'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {offerRerequestLimitDaysAtom} from '../../utils/versionService/atoms'
import CreateOfferMarketplaceSuggestion from '../InsideRouter/components/MarketplaceScreen/components/CreateOfferMarketplaceSuggestion'
import EnableNotificationsMarketplaceSuggestion from '../InsideRouter/components/MarketplaceScreen/components/EnableNotificationsMarketplaceSuggestion'
import ImportContactsMarketplaceSuggestion from '../InsideRouter/components/MarketplaceScreen/components/ImportContactsMarketplaceSuggestion'
import OfferOnMarketplace from '../OfferOnMarketplace'

interface Props {
  readonly isFirst: boolean
  readonly offerAtom: Atom<OneOfferInState>
}

function MarketplaceFirstOfferBanner(): React.ReactElement | null {
  const marketplaceFirstOfferBanner = useAtomValue(
    marketplaceFirstOfferBannerAtom
  )

  if (marketplaceFirstOfferBanner == null) return null

  return (
    <>
      <Stack height="$5" />
      <Stack px="$5">
        {marketplaceFirstOfferBanner === 'importContacts' ? (
          <ImportContactsMarketplaceSuggestion />
        ) : marketplaceFirstOfferBanner === 'enableNotifications' ? (
          <EnableNotificationsMarketplaceSuggestion />
        ) : (
          <CreateOfferMarketplaceSuggestion />
        )}
      </Stack>
    </>
  )
}

function OffersListItem({isFirst, offerAtom}: Props): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const route = useRoute()
  const offer = useAtomValue(offerAtom)
  const rerequestLimitDays = useAtomValue(offerRerequestLimitDaysAtom)
  const marketplaceFirstOfferBanner = useAtomValue(
    marketplaceFirstOfferBannerAtom
  )

  const isMine = useMemo(
    () => !!offer.ownershipInfo?.adminId,
    [offer.ownershipInfo?.adminId]
  )
  const isMyOffer = !!offer.ownershipInfo

  const chatForOfferAtom = useMemo(
    () =>
      chatWithMessagesForOfferAtom({
        offerId: offer.offerInfo.offerId,
        isMyOffer,
        otherSidePublicKey: Option.some(
          offer.offerInfo.publicPart.offerPublicKey
        ),
      }),
    [
      isMyOffer,
      offer.offerInfo.offerId,
      offer.offerInfo.publicPart.offerPublicKey,
    ]
  )
  const chatForOffer = useAtomValue(chatForOfferAtom)

  const canBeRequested = useMemo(() => {
    if (!chatForOffer) return true
    return canChatBeRequested(chatForOffer, rerequestLimitDays).canBeRerequested
  }, [chatForOffer, rerequestLimitDays])

  const navigateToOffer = useCallback(() => {
    if (isMine) {
      navigation.navigate('MyOfferDetail', {
        offerId: offer.offerInfo.offerId,
      })
    } else {
      navigation.navigate('OfferDetail', {offerId: offer.offerInfo.offerId})
    }
  }, [isMine, navigation, offer.offerInfo.offerId])

  const navigateToChat = useCallback(() => {
    if (!chatForOffer?.chat) return

    navigation.navigate('ChatDetail', {
      otherSideKey: chatForOffer.chat.otherSide.publicKey,
      inboxKey: chatForOffer.chat.inbox.privateKey.publicKeyPemBase64,
    })
  }, [chatForOffer, navigation])

  const content = useMemo((): {
    buttonText: string
    actionableUI: boolean
    onPress: () => void
  } => {
    if (isMine) {
      return {
        buttonText: offer.offerInfo.publicPart.listingType
          ? t('myOffers.editOffer')
          : t('myOffers.updateOffer'),
        actionableUI: true,
        onPress: navigateToOffer,
      }
    }

    const state = getRequestState(chatForOffer)
    if (state === 'initial') {
      return {
        buttonText: t('common.request'),
        actionableUI: true,
        onPress: navigateToOffer,
      }
    }

    if (state === 'requested') {
      if (canBeRequested) {
        return {
          buttonText: t('common.requestAgain'),
          actionableUI: true,
          onPress: navigateToChat,
        }
      } else {
        return {
          buttonText: t('common.seeDetail'),
          actionableUI: false,
          onPress: navigateToChat,
        }
      }
    }

    if (state === 'cancelled') {
      if (canBeRequested) {
        return {
          actionableUI: true,
          buttonText: t('common.requestAgain'),
          onPress: navigateToOffer,
        }
      } else {
        return {
          actionableUI: false,
          buttonText: t('common.seeDetail'),
          onPress: navigateToOffer,
        }
      }
    }

    if (state === 'accepted') {
      return {
        buttonText: t('offer.goToChat'),
        actionableUI: false,
        onPress: navigateToChat,
      }
    }

    if (state === 'denied') {
      if (canBeRequested) {
        return {
          actionableUI: true,
          buttonText: t('common.requestAgain'),
          onPress: navigateToChat,
        }
      } else {
        return {
          actionableUI: false,
          buttonText: t('common.seeDetail'),
          onPress: navigateToChat,
        }
      }
    }

    if (state === 'deleted') {
      if (canBeRequested) {
        return {
          actionableUI: true,
          buttonText: t('common.requestAgain'),
          onPress: navigateToOffer,
        }
      } else {
        return {
          actionableUI: false,
          buttonText: t('common.seeDetail'),
          onPress: navigateToOffer,
        }
      }
    }

    if (state === 'otherSideLeft') {
      return {
        actionableUI: false,
        buttonText: t('offer.goToChat'),
        onPress: navigateToChat,
      }
    }

    return {
      buttonText: t('common.request'),
      actionableUI: true,
      onPress: navigateToOffer,
    }
  }, [
    canBeRequested,
    chatForOffer,
    isMine,
    navigateToChat,
    navigateToOffer,
    offer.offerInfo.publicPart.listingType,
    t,
  ])

  return (
    <>
      <Stack px="$5">
        <OfferOnMarketplace offer={offer} onPress={content.onPress} />
      </Stack>
      {route.name === 'Marketplace' && isFirst && !isMyOffer ? (
        <MarketplaceFirstOfferBanner />
      ) : null}
    </>
  )
}

export default React.memo(OffersListItem)

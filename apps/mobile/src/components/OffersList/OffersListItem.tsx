import {useNavigation} from '@react-navigation/native'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {atom, useAtomValue, type Atom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {Stack} from 'tamagui'
import {useChatWithMessagesForOffer} from '../../state/chat/hooks/useChatForOffer'
import {
  canChatBeRequested,
  getRequestState,
} from '../../state/chat/utils/offerStates'
import {newOfferFeedbackDoneAtom} from '../../state/feedback/atoms'
import {baseFilterAtom} from '../../state/marketplace/atoms/filterAtoms'
import {isOfferExpired} from '../../utils/isOfferExpired'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {preferencesAtom} from '../../utils/preferences'
import {offerRerequestLimitDaysAtom} from '../../utils/versionService/atoms'
import Button from '../Button'
import OfferWithBubbleTip from '../OfferWithBubbleTip'
import UserFeedback from '../UserFeedback'
import {generateInitialFeedback} from '../UserFeedback/atoms'

interface Props {
  readonly isFirst: boolean
  readonly offerAtom: Atom<OneOfferInState>
}

function OffersListItem({isFirst, offerAtom}: Props): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const offer = useAtomValue(offerAtom)
  const rerequestLimitDays = useAtomValue(offerRerequestLimitDaysAtom)
  const preferences = useAtomValue(preferencesAtom)
  const newOfferFeedbackDone = useAtomValue(newOfferFeedbackDoneAtom)
  const baseFilter = useAtomValue(baseFilterAtom)

  const isMine = useMemo(
    () => !!offer.ownershipInfo?.adminId,
    [offer.ownershipInfo?.adminId]
  )

  // TODO make this more performant
  const chatForOffer = useChatWithMessagesForOffer({
    offerPublicKey: offer.offerInfo.publicPart.offerPublicKey,
  })

  const canBeRequested = useMemo(() => {
    if (!chatForOffer) return true
    return canChatBeRequested(chatForOffer, rerequestLimitDays).canBeRerequested
  }, [chatForOffer, rerequestLimitDays])

  const navigateToOffer = useCallback(() => {
    if (isMine) {
      navigation.navigate('CRUDOfferFlow', {
        offerId: offer.offerInfo.offerId,
        screen: 'ListingAndOfferType',
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
    <Stack mt={isFirst ? '$0' : '$6'}>
      <OfferWithBubbleTip
        isMine={isMine}
        showListingType={
          baseFilter === 'ALL_SELLING_BTC' || baseFilter === 'ALL_BUYING_BTC'
        }
        reduceDescriptionLength
        onInfoRectPress={content.onPress}
        negative={
          !content.actionableUI ||
          !offer.offerInfo.publicPart.active ||
          isOfferExpired(offer.offerInfo.publicPart.expirationDate)
        }
        button={
          <Button
            size="medium"
            text={content.buttonText}
            variant={content.actionableUI ? 'secondary' : 'primary'}
            onPress={content.onPress}
          />
        }
        offer={offer}
      />
      {!!isMine &&
        !!isFirst &&
        !newOfferFeedbackDone &&
        !!preferences.offerFeedbackEnabled && (
          <UserFeedback
            autoCloseWhenFinished
            feedbackAtom={atom(generateInitialFeedback('OFFER_RATING'))}
          />
        )}
    </Stack>
  )
}

export default OffersListItem

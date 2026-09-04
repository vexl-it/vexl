import {useNavigation} from '@react-navigation/native'
import {type OneOfferInState} from '@vexl-next/domain/src/general/offers'
import {
  Stack,
  SwipeableOfferCard,
  type SwipeableOfferCardMark,
} from '@vexl-next/ui'
import {Effect} from 'effect'
import {useAtomValue, useSetAtom, type Atom} from 'jotai'
import React, {useCallback, useMemo} from 'react'
import {useChatWithMessagesForOfferAtom} from '../../state/chat/hooks/useChatForOffer'
import {getRequestState} from '../../state/chat/utils/offerStates'
import {toggleOfferMarkActionAtom} from '../../state/marketplace/atoms/offerMarkActionAtoms'
import {useNavigateToChatDetail} from '../../utils/chat/goToChatDetail'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {getOfferMarkBadge} from '../../utils/offerHelpers'
import OfferOnMarketplace from '../OfferOnMarketplace'
import {useOffersListAnimation} from './offersListAnimation'

interface Props {
  readonly offerAtom: Atom<OneOfferInState>
  readonly swipeEnabled?: boolean
}

function OffersListItem({offerAtom, swipeEnabled}: Props): React.ReactElement {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const offer = useAtomValue(offerAtom)
  const toggleOfferMark = useSetAtom(toggleOfferMarkActionAtom)
  const {
    animateNextListChange,
    onOfferExitAnimationStart,
    onOfferExitAnimationEnd,
  } = useOffersListAnimation()

  const isMine = useMemo(
    () => !!offer.ownershipInfo?.adminId,
    [offer.ownershipInfo?.adminId]
  )
  const chatForOfferAtom = useChatWithMessagesForOfferAtom(offer)
  const chatForOffer = useAtomValue(chatForOfferAtom)

  const navigateToOffer = useCallback(() => {
    if (isMine) {
      navigation.navigate('MyOfferDetail', {
        offerId: offer.offerInfo.offerId,
      })
    } else {
      navigation.navigate('OfferDetail', {offerId: offer.offerInfo.offerId})
    }
  }, [isMine, navigation, offer.offerInfo.offerId])

  const navigateToChat = useNavigateToChatDetail(chatForOffer?.chat)

  const handleExitAnimationStart = useCallback(() => {
    onOfferExitAnimationStart(offer.offerInfo.offerId)
  }, [offer.offerInfo.offerId, onOfferExitAnimationStart])

  const handleToggleOfferMark = useCallback(
    (target: SwipeableOfferCardMark) => {
      // The card has finished sliding out (it is invisible by now), so the
      // row can return to normal stacking before the list re-sorts.
      onOfferExitAnimationEnd(offer.offerInfo.offerId)
      return animateNextListChange(() => {
        Effect.runFork(
          toggleOfferMark({
            offer,
            target: target === 'favourite' ? 'FAVOURITE' : 'ARCHIVED',
            confirmCrossTransition: false,
          })
        )
      })
    },
    [animateNextListChange, offer, onOfferExitAnimationEnd, toggleOfferMark]
  )

  const onPressCard = useMemo(() => {
    if (isMine) return navigateToOffer

    const state = getRequestState(chatForOffer)
    return state === 'requested' ||
      state === 'accepted' ||
      state === 'denied' ||
      state === 'otherSideLeft'
      ? navigateToChat
      : navigateToOffer
  }, [chatForOffer, isMine, navigateToChat, navigateToOffer])

  const card = (
    <OfferOnMarketplace
      offer={offer}
      onPress={onPressCard}
      chatForOfferAtom={chatForOfferAtom}
    />
  )

  return (
    <Stack px="$5">
      {swipeEnabled && !isMine ? (
        <SwipeableOfferCard
          offerId={offer.offerInfo.offerId}
          mark={getOfferMarkBadge(offer.flags.mark?.type)}
          labels={{
            favourite: t('offer.favorite.favorite'),
            removeFavourite: t('offer.favorite.removeFavorite'),
            archive: t('offer.archive.archive'),
            unarchive: t('offer.archive.unarchive'),
          }}
          onToggleMark={handleToggleOfferMark}
          onExitAnimationStart={handleExitAnimationStart}
        >
          {card}
        </SwipeableOfferCard>
      ) : (
        card
      )}
    </Stack>
  )
}

export default React.memo(OffersListItem)

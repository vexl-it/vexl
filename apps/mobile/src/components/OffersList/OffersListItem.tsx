import {useTranslation} from '../../utils/localization/I18nProvider'
import Button from '../Button'
import {useNavigation} from '@react-navigation/native'
import {type OneOfferInState} from '../../state/marketplace/domain'
import {Stack} from 'tamagui'
import OfferWithBubbleTip from '../OfferWithBubbleTip'
import {useCallback, useMemo} from 'react'
import {type Atom, useAtomValue} from 'jotai'
import {useChatForOffer} from '../../state/chat/hooks/useChatForOffer'
import {atom} from 'jotai'
import createChatStatusAtom from '../../state/chat/atoms/createChatStatusAtom'

interface Props {
  readonly offerAtom: Atom<OneOfferInState>
}

function OffersListItem({offerAtom}: Props): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const offer = useAtomValue(offerAtom)

  const isMine = useMemo(
    () => !!offer.ownershipInfo?.adminId,
    [offer.ownershipInfo?.adminId]
  )

  // TODO make this more performant
  const chatForOffer = useChatForOffer({
    offerPublicKey: offer.offerInfo.publicPart.offerPublicKey,
  })

  const requestStatus = useAtomValue(
    useMemo(() => {
      if (!chatForOffer) return atom(() => null)
      return createChatStatusAtom(
        chatForOffer.id,
        chatForOffer.inbox.privateKey.publicKeyPemBase64
      )
    }, [chatForOffer])
  )

  const navigateToOffer = useCallback(() => {
    navigation.navigate(isMine ? 'EditOffer' : 'OfferDetail', {
      offerId: offer.offerInfo.offerId,
    })
  }, [isMine, navigation, offer.offerInfo.offerId])

  return (
    <Stack mt={'$6'}>
      <OfferWithBubbleTip
        onInfoRectPress={navigateToOffer}
        negative={!!chatForOffer}
        button={
          <Button
            size={'medium'}
            text={
              isMine
                ? t('myOffers.editOffer')
                : requestStatus === 'denied'
                ? t('common.declined')
                : requestStatus === 'requested'
                ? t('common.requested')
                : t('common.request')
            }
            variant={
              isMine
                ? 'primary'
                : requestStatus === 'requested'
                ? 'primary'
                : requestStatus === 'denied'
                ? 'redDark'
                : 'secondary'
            }
            onPress={navigateToOffer}
          />
        }
        offer={offer}
      />
    </Stack>
  )
}

export default OffersListItem

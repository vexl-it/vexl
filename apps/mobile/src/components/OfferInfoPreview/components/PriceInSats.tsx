import {useAtomValue, useSetAtom} from 'jotai/index'
import {useEffect, useMemo} from 'react'
import {ActivityIndicator} from 'react-native'
import {XStack, getTokens} from 'tamagui'
import {type OfferInfo} from '../../../../../../packages/domain/src/general/offers'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../../state/currentBtcPriceAtoms'
import {bigNumberToString} from '../../../utils/bigNumberToString'
import calculatePriceInSats from '../../../utils/calculatePriceInSats'
import {
  InfoDivider,
  InfoItemContainer,
  InfoText,
  PriceBigger,
  PriceText,
} from '../columnsStyles'

interface Props {
  offer: OfferInfo
}

function PriceInSats({offer}: Props): JSX.Element {
  const refreshBtcPrice = useSetAtom(refreshBtcPriceActionAtom)
  const btcPriceWithState = useAtomValue(
    useMemo(
      () => createBtcPriceForCurrencyAtom(offer.publicPart.currency),
      [offer.publicPart.currency]
    )
  )

  useEffect(() => {
    void refreshBtcPrice(offer.publicPart.currency)()
  }, [offer.publicPart.currency, refreshBtcPrice])

  return (
    <XStack f={1}>
      <InfoItemContainer>
        {btcPriceWithState?.state === 'loading' ? (
          <ActivityIndicator
            size="small"
            color={getTokens().color.greyOnBlack.val}
          />
        ) : (
          <PriceText>
            <PriceBigger>
              {bigNumberToString(
                calculatePriceInSats({
                  price: offer.publicPart.amountTopLimit,
                  currentBtcPrice: btcPriceWithState?.btcPrice ?? 0,
                })
              )}
            </PriceBigger>
          </PriceText>
        )}
        <InfoText>SATS</InfoText>
      </InfoItemContainer>
      <InfoDivider />
    </XStack>
  )
}

export default PriceInSats

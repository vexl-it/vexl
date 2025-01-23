import {type OfferInfo} from '@vexl-next/domain/src/general/offers'
import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect, useMemo} from 'react'
import {Stack, XStack, getTokens} from 'tamagui'
import {
  createBtcPriceForCurrencyAtom,
  refreshBtcPriceActionAtom,
} from '../../../state/currentBtcPriceAtoms'
import {bigNumberToString} from '../../../utils/bigNumberToString'
import calculatePriceInSats from '../../../utils/calculatePriceInSats'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import VexlActivityIndicator from '../../LoadingOverlayProvider/VexlActivityIndicator'
import {
  InfoDivider,
  InfoItemContainer,
  InfoText,
  InfoTextSmall,
  PriceBigger,
} from '../columnsStyles'

interface Props {
  offer: OfferInfo
}

function PriceInSats({offer}: Props): JSX.Element {
  const {t} = useTranslation()
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
        <Stack position="absolute" top={-10}>
          <InfoTextSmall>{t('offer.approximatelyAbbreviation')}</InfoTextSmall>
        </Stack>
        <Stack f={1} ai="center" jc="center">
          {btcPriceWithState?.state === 'loading' ? (
            <VexlActivityIndicator
              size="small"
              bc={getTokens().color.greyOnBlack.val}
            />
          ) : (
            <PriceBigger>
              {bigNumberToString(
                calculatePriceInSats({
                  price: offer.publicPart.amountTopLimit,
                  currentBtcPrice: btcPriceWithState?.btcPrice?.BTC ?? 0,
                })
              )}
            </PriceBigger>
          )}
        </Stack>
        <InfoText>SATS</InfoText>
      </InfoItemContainer>
      <InfoDivider />
    </XStack>
  )
}

export default PriceInSats

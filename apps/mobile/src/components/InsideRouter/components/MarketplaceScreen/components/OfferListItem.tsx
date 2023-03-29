import styled from '@emotion/native'
import Text from '../../../../Text'
import Image from '../../../../Image'
import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {bigNumberToString} from '../../../../../utils/bigNumberToString'
import bankSvg from '../images/bankSvg'
import revolutSvg from '../images/revolutSvg'
import mapTagSvg from '../images/mapTagSvg'
import Button from '../../../../Button'
import {AnonymousAvatarFromSeed} from '../../../../AnonymousAvatar'
import randomName from '../../../../../utils/randomName'
import {useNavigation} from '@react-navigation/native'
import bubbleTipSvg from '../images/bubbleTipSvg'
import {type OfferInfo} from '@vexl-next/domain/dist/general/offers'

const RootContainer = styled.View`
  margin-top: 24px;
`

const WhiteSpaceContainer = styled.View`
  background-color: ${({theme}) => theme.colors.white};
  padding: 16px;
  border-radius: 13px;
`
const Description = styled(Text)`
  font-size: 20px;
  margin-bottom: 16px;
  font-family: '${({theme}) => theme.fonts.ttSatoshi500}';
`

const InfoContainer = styled.View`
  flex-direction: row;
`
const InfoItemContainer = styled.View`
  flex: 1;
  align-items: center;
`
const InfoDivider = styled.View`
  background-color: rgb(196, 196, 196);
  width: 1px;
  align-self: stretch;
`

const InfoText = styled(Text)`
  color: ${({theme}) => theme.colors.grayOnWhite};
  font-size: 14px;
  font-family: '${({theme}) => theme.fonts.ttSatoshi500}';
`

const PriceText = styled(InfoText)`
  margin-bottom: 8px;
`

const PriceBigger = styled(InfoText)`
  font-size: 20px;
`
const InfoIcons = styled.View`
  flex-direction: row;
  margin-bottom: 8px;
`
const PaymentIcon = styled(Image)`
  margin: 0 2px;
`

const BubbleTipContainer = styled(Image)`
  position: absolute;
  bottom: -7px;
  left: 43px;
`
const UnderBubbleContainer = styled.View`
  margin-top: 8px;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`
const AvatarStyled = styled(AnonymousAvatarFromSeed)`
  width: 48px;
  height: 48px;
`
const UnderBubbleTextContainer = styled.View`
  flex: 1;
  margin-left: 8px;
`
const UnderBubbleUpperText = styled(Text)`
  color: ${({theme}) => theme.colors.white};
`
const UnderBubbleUpperTextPink = styled(UnderBubbleUpperText)`
  color: #fcc5f3;
`

const UnderBubbleLowerText = styled(Text)`
  color: ${({theme}) => theme.colors.grayOnBlack};
  font-size: 14px;
`
const RequestButton = styled(Button)`
  align-self: stretch;
  height: auto;
`

interface Props {
  readonly offer: OfferInfo
}

function OfferListItem({offer}: Props): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  return (
    <RootContainer>
      <WhiteSpaceContainer>
        <Description fontWeight={400}>
          {offer.publicPart.offerDescription}
        </Description>
        <InfoContainer>
          <InfoItemContainer>
            <PriceText>
              {t('offer.upTo')}{' '}
              <PriceBigger>
                {bigNumberToString(offer.publicPart.amountTopLimit)}
              </PriceBigger>
            </PriceText>
            <InfoText>
              {offer.publicPart.locationState === 'ONLINE' &&
                t('offer.onlineOnly')}
              {offer.publicPart.locationState === 'IN_PERSON' &&
                t('offer.cashOnly')}
            </InfoText>
          </InfoItemContainer>
          <InfoDivider />
          {offer.publicPart.feeState === 'WITH_FEE' &&
            offer.publicPart.feeAmount !== undefined && (
              <>
                <InfoItemContainer>
                  <PriceText>
                    <PriceBigger>{offer.publicPart.feeAmount} %</PriceBigger>
                  </PriceText>
                  <InfoText>{t('offer.forSeller')}</InfoText>
                </InfoItemContainer>
                <InfoDivider />
              </>
            )}
          <InfoItemContainer>
            <InfoIcons>
              {offer.publicPart.paymentMethod.includes('CASH') && (
                <PaymentIcon source={mapTagSvg} />
              )}
              {offer.publicPart.paymentMethod.includes('REVOLUT') && (
                <PaymentIcon source={revolutSvg} />
              )}
              {offer.publicPart.paymentMethod.includes('BANK') && (
                <PaymentIcon source={bankSvg} />
              )}
            </InfoIcons>
            <InfoText>
              {offer.publicPart.paymentMethod
                .map((method) => {
                  if (method === 'CASH') {
                    return offer.publicPart.location
                      .map((one) => one.city)
                      .join(', ')
                  }
                  if (method === 'REVOLUT') {
                    return t('offer.revolut')
                  }
                  if (method === 'BANK') {
                    return t('offer.bank')
                  }
                  return null
                })
                .filter(Boolean)
                .join(', ')}
            </InfoText>
          </InfoItemContainer>
        </InfoContainer>
        <BubbleTipContainer source={bubbleTipSvg} />
      </WhiteSpaceContainer>
      <UnderBubbleContainer>
        <AvatarStyled seed={offer.offerId} />
        <UnderBubbleTextContainer>
          <UnderBubbleUpperText>
            {randomName(offer.offerId)}{' '}
            <UnderBubbleUpperTextPink>
              {offer.publicPart.offerType === 'SELL'
                ? t('offer.isSelling')
                : t('offer.isBuying')}
            </UnderBubbleUpperTextPink>
          </UnderBubbleUpperText>
          <UnderBubbleLowerText>
            {offer.privatePart.friendLevel.includes('FIRST_DEGREE')
              ? t('offer.directFriend')
              : t('offer.friendOfFriend')}
          </UnderBubbleLowerText>
        </UnderBubbleTextContainer>
        <RequestButton
          size="small"
          fontSize={14}
          text={t('common.request')}
          variant="secondary"
          onPress={() => {
            navigation.navigate('OfferDetail', {offerId: offer.offerId})
          }}
        />
        {/* Friend of friend info */}
      </UnderBubbleContainer>
    </RootContainer>
  )
}

export default OfferListItem

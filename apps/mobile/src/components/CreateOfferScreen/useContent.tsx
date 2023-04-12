import {useTranslation} from '../../utils/localization/I18nProvider'
import {type SectionProps} from './components/Section'
import OfferType from './components/OfferType'
import userSvg from './images/userSvg'
import coinsSvg from './images/coinsSvg'
import Currency from './components/Currency'
import locationSvg from '../images/locationSvg'
import Location from './components/Location'
import amountOfTransactionSvg from './images/amountOfTransactionSvg'
import paymentMethodSvg from './images/paymentMethod'
import PaymentMethod from './components/PaymentMethod'
import AmountOfTransaction from './components/AmountOfTransaction'
import networkSvg from './images/networkSvg'
import Network from './components/Network'
import descriptionSvg from './images/descriptionSvg'
import friendLevelSvg from './images/friendLevelSvg'
import Description from './components/Description'
import FriendLevel from './components/FriendLevel'
import PremiumOrDiscount from './components/PremiumOrDiscount'
import {type ReactNode, useMemo} from 'react'

export interface CreateOfferContentProps extends SectionProps {
  customSection?: ReactNode
}

export default function useContent(): CreateOfferContentProps[] {
  const {t} = useTranslation()

  return useMemo(
    () => [
      {
        title: t('createOffer.iWantTo'),
        image: userSvg,
        children: <OfferType />,
      },
      {
        title: t('createOffer.currency'),
        image: coinsSvg,
        children: <Currency />,
      },
      {
        title: t('createOffer.amountOfTransaction.amountOfTransaction'),
        image: amountOfTransactionSvg,
        children: <AmountOfTransaction />,
      },
      {
        customSection: (
          <PremiumOrDiscount
            key={t('createOffer.premiumOrDiscount.premiumOrDiscount')}
          />
        ),
      },
      {
        title: t('createOffer.location.location'),
        image: locationSvg,
        children: <Location />,
        mandatory: true,
      },
      {
        title: t('createOffer.paymentMethod.paymentMethod'),
        image: paymentMethodSvg,
        children: <PaymentMethod />,
        mandatory: true,
      },
      {
        title: t('createOffer.network.network'),
        image: networkSvg,
        children: <Network />,
        mandatory: true,
      },
      {
        title: t('createOffer.description.description'),
        image: descriptionSvg,
        children: <Description />,
        mandatory: true,
      },
      {
        title: t('createOffer.friendLevel.friendLevel'),
        image: friendLevelSvg,
        children: <FriendLevel />,
      },
    ],
    [t]
  )
}

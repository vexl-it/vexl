import {Stack, Text, XStack, YStack} from 'tamagui'
import {useMolecule} from 'jotai-molecules'
import {chatMolecule} from '../atoms'
import {useAtomValue} from 'jotai'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {useMemo} from 'react'
import {formatCurrencyAmount} from '../../../utils/localization/currency'

function Bullet(): JSX.Element {
  return <Stack bg={'$greyOnWhite'} w={'$1'} h={'$1'} br={'$1'} mx="$2" />
}

function StickyHeader(): JSX.Element | null {
  const {t} = useTranslation()
  const {offerForChatAtom, otherSideDataAtom} = useMolecule(chatMolecule)
  const offer = useAtomValue(offerForChatAtom)
  const otherSideData = useAtomValue(otherSideDataAtom)

  const offerAmount = useMemo(() => {
    if (!offer) return null

    return formatCurrencyAmount(
      offer.offerInfo.publicPart.currency,
      offer.offerInfo.publicPart.amountTopLimit
    )
  }, [offer])

  const paymentMethodsText = useMemo(() => {
    if (!offer) return null

    const result: string[] = []
    if (offer.offerInfo.publicPart.paymentMethod.includes('CASH')) {
      result.push(t('offerForm.paymentMethod.cash'))
    }
    if (offer.offerInfo.publicPart.paymentMethod.includes('BANK')) {
      result.push(t('offerForm.paymentMethod.bank'))
    }
    if (offer.offerInfo.publicPart.paymentMethod.includes('REVOLUT')) {
      result.push(t('offerForm.paymentMethod.revolut'))
    }
    return result.join(', ')
  }, [offer, t])

  if (!offer) return null
  return (
    <YStack
      py={'$2'}
      px={'$4'}
      mt={'$4'}
      borderColor="$grey"
      borderTopWidth={1}
      borderBottomWidth={1}
    >
      <Text color="$white" fontFamily="$body500" fos={16} numberOfLines={1}>
        {offer.ownershipInfo?.adminId ? t('common.me') : otherSideData.userName}
        : {offer.offerInfo.publicPart.offerDescription}
      </Text>
      <XStack alignItems={'center'}>
        <Text fontFamily="$body500" fos={14} color={'$greyOnWhite'}>
          {t('offer.upTo')}: {offerAmount}
        </Text>
        <Bullet />
        <Text fontFamily="$body500" fos={14} color={'$greyOnWhite'}>
          {paymentMethodsText}
        </Text>
        {offer.offerInfo.publicPart.paymentMethod.includes('CASH') && (
          <>
            <Bullet />
            <Text fontFamily="$body500" fos={14} color={'$greyOnWhite'}>
              {offer.offerInfo.publicPart.location
                .map((one) => one.city)
                .join(', ')}
            </Text>
          </>
        )}
      </XStack>
    </YStack>
  )
}

export default StickyHeader

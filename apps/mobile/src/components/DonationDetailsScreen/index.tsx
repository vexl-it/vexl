import Clipboard from '@react-native-clipboard/clipboard'
import {Effect, Fiber} from 'effect'
import {useAtomValue, useSetAtom} from 'jotai'
import {DateTime} from 'luxon'
import React, {useEffect, useMemo} from 'react'
import {TouchableOpacity} from 'react-native'
import {getTokens, ScrollView, Stack, Text, XStack} from 'tamagui'
import {type RootStackScreenProps} from '../../navigationTypes'
import {SATOSHIS_IN_BTC} from '../../state/currentBtcPriceAtoms'
import {singleDonationAtom} from '../../state/donations/atom'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {
  localizedDecimalNumberActionAtom,
  localizedPriceActionAtom,
} from '../../utils/localization/localizedNumbersAtoms'
import BtcInvoiceStatus from '../BtcInvoiceStatus'
import Button from '../Button'
import {
  dummyDonation,
  updateSingleInvoiceStatusTypeRepeatingActionAtom,
} from '../DonationPrompt/atoms'
import Image from '../Image'
import checkIconSvg from '../images/checkIconSvg'
import copySvg from '../images/copySvg'
import Screen from '../Screen'
import ScreenTitle from '../ScreenTitle'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {showClaimConfirmationDialogActionAtom} from './atoms'

type Props = RootStackScreenProps<'DonationDetails'>

function DonationDetailsScreen({
  route: {
    params: {invoiceId},
  },
}: Props): React.ReactElement {
  const {t} = useTranslation()
  const mySingleDonation = useAtomValue(
    useMemo(() => singleDonationAtom(invoiceId), [invoiceId])
  )
  const storeId = mySingleDonation?.storeId ?? dummyDonation.storeId
  const satsAmount = Number(mySingleDonation?.btcAmount ?? 0) * SATOSHIS_IN_BTC
  const localizedTotalSats = useSetAtom(localizedDecimalNumberActionAtom)({
    number: satsAmount,
  })
  const localizedFiatAmount = useSetAtom(localizedPriceActionAtom)({
    number: mySingleDonation?.fiatAmount ?? 0,
    currency: mySingleDonation?.currency,
  })
  const localizedExchangeRate = useSetAtom(localizedPriceActionAtom)({
    number: mySingleDonation?.exchangeRate ?? 0,
    currency: mySingleDonation?.currency,
  })
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const showClaimConfirmationDialog = useSetAtom(
    showClaimConfirmationDialogActionAtom
  )
  const updateSingleInvoiceStatusTypeRepeating = useSetAtom(
    updateSingleInvoiceStatusTypeRepeatingActionAtom
  )

  const showClaimConfirmationButton = ![
    'New',
    'Expired',
    'Invalid',
    'Processing',
  ].includes(mySingleDonation?.status ?? '')

  useEffect(() => {
    const fiber = Effect.runFork(
      updateSingleInvoiceStatusTypeRepeating({invoiceId, storeId})
    )

    return () => {
      Effect.runFork(Fiber.interrupt(fiber))
    }
  }, [invoiceId, storeId, updateSingleInvoiceStatusTypeRepeating])

  return (
    <Screen customHorizontalPadding={getTokens().space[2].val}>
      <ScreenTitle
        allowMultipleLines
        mb="$5"
        text={t('donations.donationDetails')}
        withBottomBorder
        withBackButton
      />
      <ScrollView f={1} showsVerticalScrollIndicator={false}>
        <Stack gap="$4">
          <Stack gap="$2">
            <XStack ai="center" jc="space-between">
              <Text col="$white" fos={14} ff="$body500">
                {t('donationPrompt.totalPrice')}
              </Text>
              <Text col="$white" fos={14} ff="$body500">
                {`${localizedTotalSats} sats`}
              </Text>
            </XStack>
            <XStack ai="center" jc="space-between">
              <Text col="$white" fos={14} ff="$body500">
                {t('donationPrompt.totalFiat')}
              </Text>
              <Text col="$white" fos={14} ff="$body500">
                {localizedFiatAmount}
              </Text>
            </XStack>
            <XStack ai="center" jc="space-between">
              <Text col="$white" fos={14} ff="$body500">
                {t('donationPrompt.exchangeRate')}
              </Text>
              <Text col="$white" fos={14} ff="$body500">
                {`1 BTC = ${localizedExchangeRate}`}
              </Text>
            </XStack>
            <XStack ai="center" jc="space-between">
              <Text col="$white" fos={14} ff="$body500">
                {t('donationPrompt.amountDue')}
              </Text>
              <Text col="$white" fos={14} ff="$body500">
                {`${localizedTotalSats} sats`}
              </Text>
            </XStack>
            <XStack ai="center" jc="space-between">
              <Text col="$white" fos={14} ff="$body500">
                {t('donationConfirmation.invoiceId')}
              </Text>
              <XStack ai="center" gap="$2">
                <TouchableOpacity
                  onPress={() => {
                    Clipboard.setString(mySingleDonation?.invoiceId ?? '')
                    setToastNotification({
                      visible: true,
                      text: t('common.copied'),
                      icon: checkIconSvg,
                    })
                  }}
                >
                  <Image source={copySvg} fill={getTokens().color.white.val} />
                </TouchableOpacity>
                <Text col="$white" fos={14} ff="$body500">
                  {mySingleDonation?.invoiceId ?? 'N/A'}
                </Text>
              </XStack>
            </XStack>
            <XStack ai="center" jc="space-between">
              <Text col="$white" fos={14} ff="$body500">
                {t('donationPrompt.createdAt')}
              </Text>
              <Text col="$white" fos={14} ff="$body500">
                {DateTime.fromSeconds(
                  mySingleDonation?.createdTime ?? 0
                ).toLocaleString(DateTime.DATETIME_MED)}
              </Text>
            </XStack>
            {mySingleDonation?.status === 'Expired' && (
              <XStack ai="center" jc="space-between">
                <Text col="$white" fos={14} ff="$body500">
                  {t('donationPrompt.expiredAt')}
                </Text>
                <Text col="$white" fos={14} ff="$body500">
                  {DateTime.fromSeconds(
                    mySingleDonation?.expirationTime ?? 0
                  ).toLocaleString(DateTime.DATETIME_MED)}
                </Text>
              </XStack>
            )}
            <Stack als="center" my="$4">
              <BtcInvoiceStatus
                donationPaymentMethod={
                  mySingleDonation?.paymentMethod ?? dummyDonation.paymentMethod
                }
                paymentLink={
                  mySingleDonation?.paymentLink ?? dummyDonation.paymentLink
                }
                status={mySingleDonation?.status ?? dummyDonation.status}
              />
            </Stack>
            {mySingleDonation?.status === 'New' && (
              <>
                <Stack w="100%" h={0.5} mx="$-4" bg="$grey" />
                <Stack gap="$2" mt="$4">
                  <XStack ai="center" jc="space-between">
                    <Text fos={18} col="$white" ff="$body500">
                      {mySingleDonation?.paymentMethod === 'BTC-LN'
                        ? t('offerForm.network.lightning').toUpperCase()
                        : t('offerForm.network.onChain').toUpperCase()}
                    </Text>
                    <Button
                      size="small"
                      beforeIcon={copySvg}
                      iconFill={getTokens().color.main.val}
                      variant="primary"
                      text={t('donations.copyPaymentLink')}
                      onPress={() => {
                        Clipboard.setString(mySingleDonation?.paymentLink ?? '')
                        setToastNotification({
                          visible: true,
                          text: t('common.copied'),
                          icon: checkIconSvg,
                        })
                      }}
                    />
                  </XStack>
                  <Text col="$white" fos={14}>
                    {mySingleDonation?.paymentLink}
                  </Text>
                </Stack>
              </>
            )}
          </Stack>
        </Stack>
      </ScrollView>
      <Stack>
        {!!showClaimConfirmationButton && (
          <Button
            iconFill={getTokens().color.main.val}
            variant="secondary"
            text={t('donations.claimConfirmation')}
            onPress={() => {
              Effect.runFork(showClaimConfirmationDialog())
            }}
          />
        )}
      </Stack>
    </Screen>
  )
}

export default DonationDetailsScreen

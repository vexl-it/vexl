import Clipboard from '@react-native-clipboard/clipboard'
import {useNavigation} from '@react-navigation/native'
import {
  Button,
  Copy,
  Download,
  NavigationBar,
  Screen,
  Typography,
  useTheme,
  XmarkCancelClose,
} from '@vexl-next/ui'
import {ScrollView, Stack, YStack} from '@vexl-next/ui/src/primitives'
import {useSetAtom} from 'jotai'
import React from 'react'
import {getTokens} from 'tamagui'
import {type DonationsFlowScreenProps} from '../../navigationTypes'
import {useTranslation} from '../../utils/localization/I18nProvider'
import {SharableQrCode, type SharableQrCodeHandle} from '../SharableQrCode'
import {toastNotificationAtom} from '../ToastNotification/atom'
import {
  Card,
  DonationSummaryCard,
  type DonationSummaryData,
} from './DonationDetailsSummary'

const QR_CODE_SIZE = 300
const QR_CODE_BORDER_WIDTH = 2

export function NewDonationDetails({
  footerHeight,
  paymentLink,
  isLightning,
  summary,
}: {
  readonly footerHeight: number
  readonly paymentLink: string
  readonly isLightning: boolean
  readonly summary: DonationSummaryData
}): React.ReactElement {
  const {t} = useTranslation()
  const navigation =
    useNavigation<DonationsFlowScreenProps<'DonationDetails'>['navigation']>()
  const theme = useTheme()
  const tokens = getTokens()
  const qrCodeRef = React.useRef<SharableQrCodeHandle>(null)
  const setToastNotification = useSetAtom(toastNotificationAtom)
  const paymentLabel = isLightning
    ? t('offerForm.network.lightning')
    : t('offerForm.network.onChainRedesign')

  return (
    <Screen
      navigationBar={
        <NavigationBar
          style="back"
          title={t('donations.completePayment')}
          rightActions={[
            {
              icon: XmarkCancelClose,
              onPress: navigation.goBack,
            },
          ]}
        />
      }
      footer={
        <Button width="100%" onPress={navigation.goBack}>
          {t('common.close')}
        </Button>
      }
    >
      <ScrollView
        flex={1}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: footerHeight + tokens.space.$5.val,
        }}
      >
        <YStack gap="$5">
          <DonationSummaryCard summary={summary} />

          <Card>
            <Stack
              width={QR_CODE_SIZE + QR_CODE_BORDER_WIDTH * 2}
              height={QR_CODE_SIZE + QR_CODE_BORDER_WIDTH * 2}
              alignItems="center"
              justifyContent="center"
              backgroundColor="$white100"
              borderColor="$white100"
              borderRadius="$3"
              borderWidth={QR_CODE_BORDER_WIDTH}
              overflow="hidden"
              alignSelf="center"
            >
              <SharableQrCode
                ref={qrCodeRef}
                size={QR_CODE_SIZE}
                value={paymentLink}
                logo={
                  isLightning
                    ? require('../images/lightningLogo.png')
                    : require('../images/btcLogo.png')
                }
                logoSize={tokens.size.$11.val}
                logoBackgroundColor={theme.gradientHelper.get()}
                ecl="H"
              />
            </Stack>
            <Button
              size="small"
              variant="secondary"
              width="100%"
              icon={Download}
              onPress={() => {
                qrCodeRef.current?.generateBase64File()
              }}
            >
              {t('donations.downloadImage')}
            </Button>
          </Card>

          <Card>
            <YStack gap="$2">
              <Typography variant="micro" color="$foregroundSecondary">
                {paymentLabel}
              </Typography>
              <Typography variant="descriptionBold" color="$foregroundPrimary">
                {paymentLink}
              </Typography>
            </YStack>
            <Button
              size="small"
              variant="secondary"
              width="100%"
              icon={Copy}
              onPress={() => {
                Clipboard.setString(paymentLink)
                setToastNotification(t('donations.copiedToClipboard'))
              }}
            >
              {t('common.copy')}
            </Button>
          </Card>
        </YStack>
      </ScrollView>
    </Screen>
  )
}

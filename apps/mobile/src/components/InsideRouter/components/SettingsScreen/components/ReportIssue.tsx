import {useTranslation} from '../../../../../utils/localization/I18nProvider'
import {useAtom} from 'jotai'
import SettingsScreenDialog from './SettingsScreenDialog'
import Image from '../../../../Image'
import emailIconSvg from '../images/emailIconSvg'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {reportIssueDialogVisibleAtom} from '../atoms'
import openUrl from '../../../../../utils/openUrl'
import {Platform} from 'react-native'
import {version} from '../../../../../utils/environment'

function ReportIssue(): JSX.Element {
  const {t} = useTranslation()
  const tokens = getTokens()
  const [reportIssueVisible, setReportIssueVisible] = useAtom(
    reportIssueDialogVisibleAtom
  )

  const supportEmail = t('settings.items.supportEmail')
  const emailBody = encodeURIComponent(
    `${t('reportIssue.predefinedBody')}\n\n${Platform.OS}-${version}-${
      Platform.Version
    }\n\n`
  )

  return (
    <SettingsScreenDialog
      secondaryButton={{
        text: t('common.gotIt'),
      }}
      primaryButton={{
        text: t('reportIssue.openInEmail'),
        onPress: () => {
          openUrl(
            `mailto:${supportEmail}?body=${emailBody}`,
            t('settings.items.supportEmail')
          )()
          return true
        },
      }}
      onClose={() => {
        setReportIssueVisible(false)
      }}
      title={t('reportIssue.somethingWentWrong')}
      subtitle={t('reportIssue.feelFreeToGetInTouch')}
      visible={reportIssueVisible}
    >
      <XStack
        ai="center"
        gap="$3"
        mt="$6"
        onPress={() => {
          openUrl(
            `mailto:${supportEmail}?body=${emailBody}`,
            t('settings.items.supportEmail')
          )()
        }}
      >
        <Stack
          ai="center"
          jc="center"
          bc="$greyAccent5"
          p="$3"
          br="$5"
        >
          <Image stroke={tokens.color.greyOnWhite.val} source={emailIconSvg} />
        </Stack>
        <Text fos={18} ff="$body500" col="$black">
          {supportEmail}
        </Text>
      </XStack>
    </SettingsScreenDialog>
  )
}

export default ReportIssue

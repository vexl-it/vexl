import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {atom, useAtomValue} from 'jotai'
import SvgQRCode from 'react-native-qrcode-svg'
import {Stack, Text, YStack} from 'tamagui'
import {
  translationAtom,
  useTranslation,
} from '../../../../../utils/localization/I18nProvider'
import {askAreYouSureActionAtom} from '../../../../AreYouSureDialog'
import {encodedUserDetailsUriAtom} from '../atoms'

export const qrCodeDialogAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return pipe(
    set(askAreYouSureActionAtom, {
      variant: 'info',
      steps: [
        {
          type: 'StepWithChildren',
          MainSectionComponent: QrCode,
          positiveButtonText: t('common.gotIt'),
        },
      ],
    }),
    TE.match(
      () => {},
      () => {}
    )
  )()
})

function QrCode(): JSX.Element {
  const {t} = useTranslation()
  const encodedUserDetailsUri = useAtomValue(encodedUserDetailsUriAtom)

  return (
    <Stack>
      <YStack ai="center" space="$4">
        <Stack height={350} ai="center" jc="center">
          <SvgQRCode
            size={300}
            value={encodedUserDetailsUri}
            logo={require('../images/app_logo.png')}
          />
        </Stack>
        <Text col="$black" fos={28} ff="$heading">
          {t('qrCode.joinVexl')}
        </Text>
      </YStack>
    </Stack>
  )
}

export default QrCode

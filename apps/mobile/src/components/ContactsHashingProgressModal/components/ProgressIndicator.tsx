import {useAtomValue} from 'jotai'
import {Stack, Text, XStack} from 'tamagui'
import {hashingProgressPercentageAtom} from '../atoms'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import ProgressBar from '../../ProgressBar'

function ProgressIndicator(): JSX.Element {
  const {t} = useTranslation()
  const hashingProgressPercentage = useAtomValue(hashingProgressPercentageAtom)

  return (
    <Stack gap={'$2'}>
      <ProgressBar percentDone={hashingProgressPercentage} />
      <XStack ai={'center'} jc={'space-between'}>
        <Text fos={14} ff={'$body500'} col={'$black'}>
          {t('addContactDialog.currentProgress')}
        </Text>
        <Text fos={14} ff={'$body500'} col={'$greyOnWhite'}>
          {`${Math.round(hashingProgressPercentage)} %`}
        </Text>
      </XStack>
    </Stack>
  )
}

export default ProgressIndicator

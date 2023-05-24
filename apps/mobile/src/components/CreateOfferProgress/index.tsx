import {useMemo} from 'react'
import {Text, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../utils/localization/I18nProvider'
import ProgressBar from './ProgressBar'

interface Props {
  leftText?: string
  total: number
  totalDone: number
}

function CreateOfferProgress({leftText, total, totalDone}: Props): JSX.Element {
  const {t} = useTranslation()

  const percentDone = useMemo(
    () => (total !== 0 ? Math.round((totalDone / total) * 100) : 0),
    [total, totalDone]
  )

  return (
    <YStack gap={'$2'}>
      <ProgressBar percentDone={percentDone} />
      <XStack fd={'row'} ai={'center'} jc={'space-between'}>
        <Text fos={14} ff={'$body500'} col={'$black'}>
          {leftText}
        </Text>
        <Text fos={14} ff={'$body500'} col={'$greyOnWhite'}>
          {t('progressBar.itemsDone', {percentDone})}
        </Text>
      </XStack>
    </YStack>
  )
}

export default CreateOfferProgress

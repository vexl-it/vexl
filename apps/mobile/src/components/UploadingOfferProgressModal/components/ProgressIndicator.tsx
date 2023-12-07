import {useAtomValue} from 'jotai'
import {Spinner, Text, XStack, YStack} from 'tamagui'
import ProgressBar from '../../ProgressBar'
import {uploadingProgressDataForProgressIndicatorElementAtom} from '../atoms'

function ProgressIndicator(): JSX.Element {
  const data = useAtomValue(
    uploadingProgressDataForProgressIndicatorElementAtom
  )

  return (
    <YStack gap={'$2'}>
      {data.indicateProgress.type === 'intermediate' && (
        <Spinner color={'$black'} />
      )}
      {data.indicateProgress.type === 'progress' && (
        <ProgressBar percentDone={data.indicateProgress.percentage} />
      )}

      <XStack fd={'row'} ai={'center'} jc={'space-between'}>
        <Text fos={14} ff={'$body500'} col={'$black'}>
          {data.belowProgressLeft ?? ''}
        </Text>
        {
          <Text fos={14} ff={'$body500'} col={'$greyOnWhite'}>
            {data.belowProgressRight ?? ''}
          </Text>
        }
      </XStack>
    </YStack>
  )
}

export default ProgressIndicator

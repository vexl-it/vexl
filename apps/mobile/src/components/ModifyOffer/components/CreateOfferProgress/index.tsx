import {useMemo} from 'react'
import {Text, XStack, YStack} from 'tamagui'
import {useTranslation} from '../../../../utils/localization/I18nProvider'
import ProgressBar from './components/ProgressBar'
import {useMolecule} from 'jotai-molecules'
import {offerFormMolecule} from '../../atoms/offerFormStateAtoms'
import {useAtomValue} from 'jotai'
import {ActivityIndicator} from 'react-native'

interface Props {
  leftText?: string
}

function CreateOfferProgress({leftText}: Props): JSX.Element {
  const {t} = useTranslation()
  const {createOfferProgressAtom} = useMolecule(offerFormMolecule)
  const offerProgress = useAtomValue(createOfferProgressAtom)

  const percentDone = useMemo(() => {
    if (!offerProgress?.percentage || offerProgress?.percentage.total === 0)
      return 0

    return Math.round(
      ((offerProgress.percentage.current + 1) /
        offerProgress.percentage.total) *
        100
    )
  }, [offerProgress])

  return (
    <YStack gap={'$2'}>
      {offerProgress?.percentage ? (
        <ProgressBar percentDone={percentDone} />
      ) : (
        <ActivityIndicator />
      )}
      <XStack fd={'row'} ai={'center'} jc={'space-between'}>
        <Text fos={14} ff={'$body500'} col={'$black'}>
          {leftText}
        </Text>
        <Text fos={14} ff={'$body500'} col={'$greyOnWhite'}>
          {offerProgress?.currentState !== undefined && (
            <>
              {t(`progressBar.${offerProgress.currentState}`, {
                percentDone: percentDone ?? 0,
              })}
            </>
          )}
        </Text>
      </XStack>
    </YStack>
  )
}

export default CreateOfferProgress

import {Stack, Text} from 'tamagui'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {useAtom} from 'jotai'
import {useMemo} from 'react'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import {type ObjectionType} from '@vexl-next/domain/src/general/feedback'
import {useMolecule} from 'jotai-molecules'
import {feedbackMolecule} from '../atoms'

interface Props extends TouchableOpacityProps {
  objection: ObjectionType
}

function ObjectionCell({objection, ...props}: Props): JSX.Element {
  const {t} = useTranslation()
  const {createIsObjectionSelectedAtom} = useMolecule(feedbackMolecule)

  const [isSelected, select] = useAtom(
    useMemo(
      () => createIsObjectionSelectedAtom(objection),
      [createIsObjectionSelectedAtom, objection]
    )
  )

  return (
    <TouchableOpacity
      onPress={() => {
        select(!isSelected)
      }}
      {...props}
    >
      <Stack
        ai={'center'}
        jc={'center'}
        px={'$4'}
        py={'$2'}
        br={'$4'}
        bc={isSelected ? '$yellowAccent2' : '$greyAccent1'}
        mb={'$2'}
      >
        <Text fos={16} ff={'$body500'} col={isSelected ? '$main' : '$white'}>
          {t(`feedback.objection.${objection}`)}
        </Text>
      </Stack>
    </TouchableOpacity>
  )
}

export default ObjectionCell

import {useMolecule} from 'bunshi/dist/react'
import {type PrimitiveAtom, useAtomValue} from 'jotai'
import {Stack, Text} from 'tamagui'
import {accessCodeMolecule} from '../../../atoms'

interface Props {
  accessCodeElementAtom: PrimitiveAtom<string>
  index: number
}

function CodeInputElement({accessCodeElementAtom, index}: Props): JSX.Element {
  const {isCodeInvalidAtom} = useMolecule(accessCodeMolecule)
  const isCodeInvalid = useAtomValue(isCodeInvalidAtom)
  const accessCodeElement = useAtomValue(accessCodeElementAtom)

  return (
    <Stack
      ai="center"
      jc="center"
      h={48}
      w={48}
      bc="$greyAccent5"
      borderRadius="$4"
      borderWidth={2}
      borderColor={isCodeInvalid ? '$red' : '$greyAccent5'}
    >
      <Text fos={18} ff="$body400" col="$black" textAlign="center">
        {accessCodeElement}
      </Text>
    </Stack>
  )
}

export default CodeInputElement

import {Stack, Typography} from '@vexl-next/ui'
import {useMolecule} from 'bunshi/dist/react'
import {type PrimitiveAtom, useAtomValue} from 'jotai'
import React from 'react'
import {accessCodeMolecule} from '../../../atoms'

interface Props {
  accessCodeElementAtom: PrimitiveAtom<string>
  index: number
}

function CodeInputElement({
  accessCodeElementAtom,
  index,
}: Props): React.ReactElement {
  const {isCodeInvalidAtom} = useMolecule(accessCodeMolecule)
  const isCodeInvalid = useAtomValue(isCodeInvalidAtom)
  const accessCodeElement = useAtomValue(accessCodeElementAtom)

  return (
    <Stack
      ai="center"
      jc="center"
      h={48}
      w={48}
      backgroundColor="$backgroundPrimary"
      borderRadius="$4"
      borderWidth={1}
      borderColor={isCodeInvalid ? '$redForeground' : '$backgroundHighlight'}
    >
      <Typography variant="paragraph" color="$foregroundPrimary">
        {accessCodeElement}
      </Typography>
    </Stack>
  )
}

export default CodeInputElement

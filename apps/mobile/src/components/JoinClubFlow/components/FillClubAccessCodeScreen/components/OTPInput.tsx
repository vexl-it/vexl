import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import React, {type Ref, useRef} from 'react'
import {TouchableWithoutFeedback} from 'react-native'
import {Input, XStack, YStack} from 'tamagui'
import atomKeyExtractor from '../../../../../utils/atomUtils/atomKeyExtractor'
import {accessCodeMolecule, CODE_LENGTH} from '../../../atoms'
import CodeInputElement from './CodeInputElement'

function OTPInput(): React.ReactElement {
  const ref: Ref<Input> = useRef(null)
  const {accessCodeAtomsAtom, handleAccessCodeElementChangeActionAtom} =
    useMolecule(accessCodeMolecule)
  const accessCodeAtoms = useAtomValue(accessCodeAtomsAtom)
  const handleAccessCodeElementChange = useSetAtom(
    handleAccessCodeElementChangeActionAtom
  )

  return (
    <TouchableWithoutFeedback onPress={() => ref.current?.focus()}>
      <YStack gap="$2">
        <XStack gap="$2">
          {accessCodeAtoms.map((atom, index) => (
            <CodeInputElement
              key={atomKeyExtractor(atom)}
              index={index}
              accessCodeElementAtom={atom}
            />
          ))}
        </XStack>
        <Input
          caretHidden
          pos="absolute"
          zIndex={-1}
          borderWidth={0}
          ref={ref}
          autoFocus
          maxLength={CODE_LENGTH}
          keyboardType="number-pad"
          onChangeText={handleAccessCodeElementChange}
        />
      </YStack>
    </TouchableWithoutFeedback>
  )
}

export default OTPInput

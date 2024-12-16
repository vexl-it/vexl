import {Schema} from 'effect'
import {useAtom} from 'jotai'
import {Text, YStack} from 'tamagui'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../../../utils/atomUtils/atomWithParsedMmkvStorage'
import {atomWithParsedMmkvStorageE} from '../../../utils/atomUtils/atomWithParsedMmkvStorageE'
import {storage} from '../../../utils/mmkv/fpMmkv'
import Button from '../../Button'

const atomE = atomWithParsedMmkvStorageE(
  'mmkvAtomTest',
  {test: 0},
  Schema.Struct({
    test: Schema.Number,
  })
)

const atom = atomWithParsedMmkvStorage(
  'mmkvAtomTest',
  {test: 0},
  z
    .object({
      test: z.number(),
    })
    .readonly()
)

export default function MmkvAtomTest(): JSX.Element {
  const [stateE, setStateE] = useAtom(atomE)
  const [state, setState] = useAtom(atom)

  return (
    <YStack>
      <Text color="$black">AtomE: {stateE.test}</Text>
      <Text color="$black">Atom: {state.test}</Text>

      <Button
        variant="primary"
        size="small"
        text="IncrementE"
        onPress={() => {
          setState((prev) => ({test: prev.test + 1}))
        }}
      />

      <Button
        variant="primary"
        size="small"
        text="IncrementE"
        onPress={() => {
          setStateE((prev) => ({test: prev.test + 1}))
        }}
      />

      <Button
        variant="primary"
        size="small"
        text="clearStorage"
        onPress={() => {
          storage._storage.delete('mmkvAtomTest')
        }}
      />
    </YStack>
  )
}

import {type PrimitiveAtom, useAtom} from 'jotai'
import {Text, XStack, YStack} from 'tamagui'
import Switch from '../../Switch'

interface Props {
  title: string
  description: string
  atom: PrimitiveAtom<boolean>
}

function PreferenceItem({title, description, atom}: Props): JSX.Element {
  const [value, setValue] = useAtom(atom)
  return (
    <XStack>
      <YStack f={1}>
        <Text fontSize={16} ff="$body600" color={'white'}>
          {title}
        </Text>
        <Text color={'$greyOnBlack'}>{description}</Text>
      </YStack>
      <Switch value={value} onValueChange={setValue} />
    </XStack>
  )
}

export default PreferenceItem

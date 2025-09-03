import React from 'react'
import {TouchableOpacity, type TouchableOpacityProps} from 'react-native'
import {Stack, Text, XStack} from 'tamagui'
import Image from '../../Image'
import checkmarkInCircleSvg from '../../images/checkmarkInCircleSvg'

interface Props extends TouchableOpacityProps {
  selected: boolean
  title: string
}

function PredefinedDonationValue({
  selected,
  title,
  ...rest
}: Props): React.ReactElement {
  return (
    <TouchableOpacity {...rest}>
      <XStack gap="$2">
        <Stack
          width={22}
          height={22}
          ai="center"
          jc="center"
          bw={1}
          borderColor="$grey"
          br={20}
        >
          {!!selected && (
            <Image width={20} height={20} source={checkmarkInCircleSvg} />
          )}
        </Stack>
        <Text ff="$body600" fos={18} col="$grey">
          {title}
        </Text>
      </XStack>
    </TouchableOpacity>
  )
}

export default PredefinedDonationValue

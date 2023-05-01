import {getTokens, Stack, Text, XStack} from 'tamagui'
import Image from './Image'
import infoSvg from './ChatDetailScreen/images/infoSvg'

function InfoSquare({
  children,
  negative,
}: {
  children: string
  negative?: boolean
}): JSX.Element {
  return (
    <XStack
      bc={negative ? '$darkRed' : '$grey'}
      p={'$3'}
      br={'$true'}
      alignItems={'center'}
    >
      <Stack w={16} h={16} mr={'$3'}>
        <Image
          fill={
            negative
              ? getTokens().color.$red.val
              : getTokens().color.$greyOnBlack.val
          }
          source={infoSvg}
        />
      </Stack>
      <Text flex={1} color={negative ? '$red' : '$white'}>
        {children}
      </Text>
    </XStack>
  )
}

export default InfoSquare

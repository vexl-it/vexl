import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {type ComponentProps} from 'react'
import {Image, Stack, Text} from 'tamagui'
import resolveLocalUri from '../../../../../utils/resolveLocalUri'
import SvgImage from '../../../../Image'

interface Props {
  topText?: string
  realLifeInfo: RealLifeInfo
  style?: ComponentProps<typeof Stack>['style']
}

function UserDataDisplay({topText, realLifeInfo, style}: Props): JSX.Element {
  return (
    <Stack ai="center" jc="center" style={style}>
      {!!topText && (
        <Stack mb="$6">
          <Text fos={18} ff="$body600" color="$white">
            {topText}
          </Text>
        </Stack>
      )}
      {realLifeInfo.image.type === 'svgXml' ? (
        <Stack w={128} h={128} mb="$7">
          <SvgImage source={realLifeInfo.image.svgXml} />
        </Stack>
      ) : (
        <Image
          width={128}
          height={128}
          br="$10"
          mb="$7"
          source={{
            uri: resolveLocalUri(realLifeInfo.image.imageUri),
          }}
        />
      )}
      <Text ff="$heading" fos={32} col="$white">
        {realLifeInfo.userName}
      </Text>
    </Stack>
  )
}

export default UserDataDisplay

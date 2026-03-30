import {type SvgString} from '@vexl-next/domain/src/utility/SvgString.brand'
import {type SvgStringOrImageUri} from '@vexl-next/domain/src/utility/SvgStringOrImageUri.brand'
import React from 'react'
import {SvgXml} from 'react-native-svg'
import {FilterImage} from 'react-native-svg/filter-image'
import {Image, View} from 'tamagui'
import resolveLocalUri from '../utils/resolveLocalUri'

interface Props {
  userImage: SvgStringOrImageUri
  grayScale?: boolean
  width: number
  height: number
}

const AVATAR_BORDER_RADIUS = 8

// I know this is not the best approach, but I was undable to find a way to apply the filter any other way and
// I don't want to have to define each user svg twice... Let's go this way!
function makeSvgIntoGrayscale(svg: SvgString): SvgString {
  try {
    const svgHeader = /<svg .*?>/.exec(svg.xml)?.[0]
    if (!svgHeader) return svg
    const inside = svg.xml.replace(svgHeader, '').replace('</svg>', '')
    return {
      xml: `${svgHeader} <filter id="grayscale"><feColorMatrix type="saturate" values="0.0"/></filter> <g filter="url(#grayscale)"> ${inside}</g> </svg>`,
    } as SvgString
  } catch (e) {
    return svg
  }
}

// TODO move grayScale images to a separate component
function UserAvatar({
  userImage,
  grayScale,
  width,
  height,
}: Props): React.ReactElement {
  // const roundedRect = useMemo(
  //   () => rrect(rect(0, 0, width, height), 12, 12),
  //   [height, width]
  // )
  if (userImage.type === 'svgXml') {
    if (grayScale) {
      return (
        <View
          width={width}
          height={height}
          borderRadius={AVATAR_BORDER_RADIUS}
          overflow="hidden"
        >
          <SvgXml
            width={width}
            height={height}
            xml={makeSvgIntoGrayscale(userImage.svgXml).xml}
          />
        </View>
      )
    } else {
      return (
        <View
          width={width}
          height={height}
          borderRadius={AVATAR_BORDER_RADIUS}
          overflow="hidden"
        >
          <SvgXml width={width} height={height} xml={userImage.svgXml.xml} />
        </View>
      )
    }
  } else {
    if (grayScale) {
      return (
        <View
          width={width}
          height={height}
          borderRadius={AVATAR_BORDER_RADIUS}
          overflow="hidden"
        >
          <FilterImage
            width={width}
            height={height}
            style={{borderRadius: AVATAR_BORDER_RADIUS}}
            filters={[{name: 'feColorMatrix', type: 'saturate', values: '0.0'}]}
            source={{uri: resolveLocalUri(userImage.imageUri)}}
          ></FilterImage>
        </View>
      )
    }
    return (
      <View
        width={width}
        height={height}
        borderRadius={AVATAR_BORDER_RADIUS}
        overflow="hidden"
      >
        <Image
          width={width}
          height={height}
          borderRadius={AVATAR_BORDER_RADIUS}
          source={{uri: resolveLocalUri(userImage.imageUri)}}
        ></Image>
      </View>
    )
  }
}

export default UserAvatar

import {Image, Stack, Text} from 'tamagui'
import React from 'react'
import {type ContactNormalizedWithHash} from '../../../state/contacts/domain'
import SvgImage from '../../Image'
import picturePlaceholderSvg from '../../images/picturePlaceholderSvg'

interface Props {
  friend: ContactNormalizedWithHash
}

function CommonFriendsListItem({friend}: Props): JSX.Element {
  return (
    <Stack fd="row" ai="center">
      {friend.imageUri ? (
        <Image
          width={50}
          height={50}
          br="$5"
          resizeMode={'cover'}
          src={{uri: friend.imageUri}}
        />
      ) : (
        <SvgImage width={50} height={50} source={picturePlaceholderSvg} />
      )}
      <Stack f={1} ml="$4" jc="space-between">
        <Text ff={'$body500'} fs={18} mb={'$2'}>
          {friend.name}
        </Text>
        <Text ff={'$body600'} col={'$greyOnBlack'} fos={14}>
          {friend.numberToDisplay}
        </Text>
      </Stack>
    </Stack>
  )
}

export default CommonFriendsListItem

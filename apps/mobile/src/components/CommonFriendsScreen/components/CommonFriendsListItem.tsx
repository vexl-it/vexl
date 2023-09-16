import {Image, Stack, Text} from 'tamagui'
import React, {useCallback} from 'react'
import {type ContactNormalizedWithHash} from '../../../state/contacts/domain'
import SvgImage from '../../Image'
import picturePlaceholderSvg from '../../images/picturePlaceholderSvg'
import Button from '../../Button'
import openUrl from '../../../utils/openUrl'

interface Props {
  friend: ContactNormalizedWithHash
}

function CommonFriendsListItem({friend}: Props): JSX.Element {
  const dialFriend = useCallback(() => {
    openUrl(`tel:${friend.normalizedNumber}`)()
  }, [friend])

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
          {friend.normalizedNumber}
        </Text>
      </Stack>
      <Button
        onPress={dialFriend}
        variant="secondary"
        text={'Call'}
        size={'small'}
      />
    </Stack>
  )
}

export default CommonFriendsListItem

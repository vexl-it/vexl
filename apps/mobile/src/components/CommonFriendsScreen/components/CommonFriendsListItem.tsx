import React, {useCallback} from 'react'
import {Image, Stack, Text} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../state/contacts/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import openUrl from '../../../utils/openUrl'
import Button from '../../Button'
import SvgImage from '../../Image'
import picturePlaceholderSvg from '../../images/picturePlaceholderSvg'

interface Props {
  friend: StoredContactWithComputedValues
}

function CommonFriendsListItem({friend}: Props): JSX.Element {
  const {t} = useTranslation()
  const dialFriend = useCallback(() => {
    openUrl(`tel:${friend.computedValues.normalizedNumber}`)()
  }, [friend])

  return (
    <Stack fd="row" ai="center">
      {friend.info.imageUri ? (
        <Image
          width={50}
          height={50}
          br="$5"
          resizeMode="cover"
          source={{uri: friend.info.imageUri}}
        />
      ) : (
        <SvgImage width={50} height={50} source={picturePlaceholderSvg} />
      )}
      <Stack f={1} ml="$4" jc="space-between">
        <Text ff="$body500" fs={18} mb="$2" col="$black">
          {friend.info.name}
        </Text>
        <Text ff="$body600" col="$greyOnBlack" fos={14}>
          {friend.computedValues.normalizedNumber}
        </Text>
      </Stack>
      <Button
        onPress={dialFriend}
        variant="secondary"
        text={t('commonFriends.call')}
        size="small"
      />
    </Stack>
  )
}

export default CommonFriendsListItem

import {parsePhoneNumber} from 'awesome-phonenumber'
import React, {useCallback} from 'react'
import {getTokens, Stack, Text, XStack} from 'tamagui'
import {type StoredContactWithComputedValues} from '../../../state/contacts/domain'
import {useTranslation} from '../../../utils/localization/I18nProvider'
import openUrl from '../../../utils/openUrl'
import Button from '../../Button'
import ContactPictureImage from '../../ContactPictureImage'
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
  const internationalNumber = parsePhoneNumber(
    friend.computedValues.normalizedNumber
  ).number?.international

  return (
    <XStack ai="center">
      <ContactPictureImage
        width={50}
        height={50}
        br="$5"
        objectFit="cover"
        contactId={friend.info.nonUniqueContactId}
        fallback={
          <SvgImage
            width={50}
            height={50}
            source={picturePlaceholderSvg}
            fill={getTokens().color.grey.val}
          />
        }
      />
      <Stack f={1} ml="$4" jc="space-between">
        <Text ff="$body500" fos={18} mb="$2" col="$black">
          {friend.info.name}
        </Text>
        <Text ff="$body600" col="$greyOnBlack" fos={14}>
          {internationalNumber ?? friend.computedValues.normalizedNumber}
        </Text>
      </Stack>
      <Button
        onPress={dialFriend}
        variant="secondary"
        text={t('commonFriends.call')}
        size="small"
      />
    </XStack>
  )
}

export default CommonFriendsListItem

import {type Option} from 'effect'
import React from 'react'
import {getTokens, Text, XStack} from 'tamagui'
import {type NonUniqueContactId} from '../../../state/contacts/domain'
import ContactPictureImage from '../../ContactPictureImage'
import SvgImage from '../../Image'
import picturePlaceholderSvg from '../../images/picturePlaceholderSvg'

interface Props {
  contactId: Option.Option<NonUniqueContactId>
  name: string
  variant: 'light' | 'dark'
  verified?: boolean
}

function CommonFriendCell({
  contactId,
  name,
  variant,
  verified,
}: Props): React.ReactElement {
  const textColor = verified
    ? '$yellowAccent1'
    : variant === 'light'
      ? '$greyOnWhite'
      : '$white'

  return (
    <XStack ai="center" mr="$3">
      <ContactPictureImage
        br="$2"
        width={30}
        height={30}
        contactId={contactId}
        objectFit="cover"
        fallback={
          <SvgImage
            height={30}
            width={30}
            borderRadius={8}
            source={picturePlaceholderSvg}
            fill={
              verified
                ? getTokens().color.yellowAccent1.val
                : getTokens().color.greyOnWhite.val
            }
          />
        }
      />
      <Text ml="$2" col={textColor} ff="$body500" fos={12}>
        {name}
      </Text>
    </XStack>
  )
}

export default CommonFriendCell

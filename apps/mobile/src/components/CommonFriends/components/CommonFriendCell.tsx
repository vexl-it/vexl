import {getTokens, Text, XStack} from 'tamagui'
import {type NonUniqueContactId} from '../../../state/contacts/domain'
import ContactPictureImage from '../../ContactPictureImage'
import SvgImage from '../../Image'
import picturePlaceholderSvg from '../../images/picturePlaceholderSvg'

interface Props {
  contactId?: NonUniqueContactId
  name: string
  variant: 'light' | 'dark'
}

function CommonFriendCell({contactId, name, variant}: Props): JSX.Element {
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
            fill={getTokens().color.greyOnWhite.val}
          />
        }
      />
      <Text
        ml="$2"
        col={variant === 'light' ? '$greyOnWhite' : '$white'}
        ff="$body500"
        fos={12}
      >
        {name}
      </Text>
    </XStack>
  )
}

export default CommonFriendCell

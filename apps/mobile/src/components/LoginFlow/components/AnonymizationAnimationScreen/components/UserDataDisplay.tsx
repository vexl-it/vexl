import {type StyleProp, type ViewStyle} from 'react-native'
import styled from '@emotion/native'
import Text, {TitleText} from '../../../../Text'
import Image from '../../../../Image'
import {type UserNameAndAvatar} from '@vexl-next/domain/dist/general/UserNameAndAvatar.brand'

const RootContainer = styled.View`
  align-items: center;
  justify-content: center;
`
const TopText = styled(Text)`
  margin-bottom: 24px;
`
const ImageStyled = styled(Image)`
  width: 128px;
  height: 128px;
  border-radius: 32px;
  margin: 0 0 32px;
`
const Name = styled(TitleText)`
  font-size: 32px;
`

interface Props {
  topText?: string
  userNameAndAvatar: UserNameAndAvatar

  style?: StyleProp<ViewStyle>
}

function UserDataDisplay({
  topText,
  userNameAndAvatar,
  style,
}: Props): JSX.Element {
  return (
    <RootContainer style={style}>
      {topText && (
        <TopText fontWeight={600} colorStyle={'white'}>
          {topText}
        </TopText>
      )}
      {userNameAndAvatar.image.type === 'svgXml' ? (
        <ImageStyled source={userNameAndAvatar.image.svgXml} />
      ) : (
        <ImageStyled source={{uri: userNameAndAvatar.image.imageUri}} />
      )}
      <Name colorStyle={'white'}>{userNameAndAvatar.userName}</Name>
    </RootContainer>
  )
}

export default UserDataDisplay

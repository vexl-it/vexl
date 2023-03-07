import styled from '@emotion/native'
import Text from '../../Text'
import React from 'react'
import {useLogout, useSessionAssumeLoggedIn} from '../../../state/session'
import Button from '../../Button'
import Image from '../../Image'

const RootContainer = styled.SafeAreaView`
  flex: 1;
  align-items: center;
  justify-content: center;
`

const ToBeDoneText = styled(Text)`
  font-family: '${(p) => p.theme.fonts.ttSatoshi600}';
  font-size: 40px;
`

export default function InsideScreen(): JSX.Element {
  const session = useSessionAssumeLoggedIn()
  console.log(session)
  const logout = useLogout()
  return (
    <RootContainer>
      <ToBeDoneText>Hello: {session.realUserData.userName}</ToBeDoneText>
      <Image
        style={{width: 128, height: 128}}
        source={
          session.realUserData.image.type === 'imageUri'
            ? {uri: session.realUserData.image.imageUri}
            : undefined
        }
      ></Image>
      <Button onPress={logout} variant={'secondary'} text={'logout'} />
    </RootContainer>
  )
}

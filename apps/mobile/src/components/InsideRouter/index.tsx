import styled from '@emotion/native'
import Text from '../Text'
import React from 'react'
import {useLogout, useSessionAssumeLoggedIn} from '../../state/session'
import Button from '../Button'

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
  const logout = useLogout()
  return (
    <RootContainer>
      <ToBeDoneText>Hello: {session.realUserData.userName}</ToBeDoneText>
      <Button onPress={logout} variant={'secondary'} text={'logout'} />
    </RootContainer>
  )
}

import styled, {css} from '@emotion/native'
import React from 'react'
import {useLogout, useSessionAssumeLoggedIn} from '../../../state/session'
import Button from '../../Button'
import Image from '../../Image'
import {useFinishPostLoginFlow} from '../../../state/postLoginOnboarding'
import WhiteContainer from '../../WhiteContainer'
import {ScrollView} from 'react-native'
import DebugFetchOffers from './DebugFetchOffers'
import Text from '../../Text'

const RootContainer = styled(WhiteContainer)`
  flex: 1;
`

export default function DebugScreen(): JSX.Element {
  const session = useSessionAssumeLoggedIn()
  const postLoginFlow = useFinishPostLoginFlow()
  const logout = useLogout()

  return (
    <RootContainer>
      <ScrollView
        style={css`
          flex: 1;
        `}
      >
        <Text>{session.phoneNumber}</Text>
        <Image
          style={{width: 128, height: 128}}
          source={
            session.realUserData.image.type === 'imageUri'
              ? {uri: session.realUserData.image.imageUri}
              : undefined
          }
        ></Image>
        <Button onPress={logout} variant={'secondary'} text={'logout'} />
        <Button
          onPress={() => {
            postLoginFlow(false)
          }}
          variant={'secondary'}
          text={'plf'}
        />

        <DebugFetchOffers />
      </ScrollView>
    </RootContainer>
  )
}

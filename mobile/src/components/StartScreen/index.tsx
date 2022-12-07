import styled from '@emotion/native'
import Text from '../Text'
import React from 'react'

const RootContainer = styled.SafeAreaView`
  flex: 1;
  align-items: center;
  justify-content: center;
`

// const WhiteArea = styled.View`
//   background-color: ${(p) => p.theme.colors.backgroundWhite};
//   flex: 1;
//   border-radius: 13px;
// `

// const TermsOfUseContainer = styled.View``
//
// const ContinueButton = styled(Button)``
//
// const LottieViewStyled = styled(LottieView)``
//
// const Name = styled.View``
//
// const LogoImage = styled(SvgUri)``
//
// const Title = styled(Text)``
//
// const TermsOfUseIcon = styled(SvgUri)``
//
// const TermsOfUseText = styled(Text)``

const ToBeDoneText = styled(Text)`
  font-family: '${(p) => p.theme.fonts.ttSatoshi600}';
  font-size: 40px;
`

export default function StartScreen(): JSX.Element {
  return (
    <RootContainer>
      <ToBeDoneText colorStyle={'white'}>To be done</ToBeDoneText>
    </RootContainer>
  )
}

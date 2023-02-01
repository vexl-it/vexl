import ProgressPopup from '../ProgressPopup'
import Text from '../Text'
import styled from '@emotion/native'
import LottieView from 'lottie-react-native'
import {useState} from 'react'
import useContent from './useContent'

const RootContainer = styled.SafeAreaView`
  flex: 1;
`

const TextStyled = styled(Text)`
  font-size: 24px;
  font-family: '${(p) => p.theme.fonts.ppMonument}';
`

const LottieViewStyled = styled(LottieView)`
  flex: 1;
`

function Intro(): JSX.Element {
  const [page, setPage] = useState(0)
  const content = useContent()

  return (
    <RootContainer>
      <ProgressPopup
        currentPage={page}
        numberOfPages={content.length}
        onNext={setPage}
        onFinish={() => { console.log('finish'); }}
        onSkip={() => { console.log('skip'); }}
      >
        <LottieViewStyled loop={false} autoPlay source={content[page].lottie} />
        <TextStyled colorStyle={'black'}>{content[page].title}</TextStyled>
      </ProgressPopup>
    </RootContainer>
  )
}

export default Intro

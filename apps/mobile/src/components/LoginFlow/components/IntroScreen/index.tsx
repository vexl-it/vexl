import ProgressJourney from '../../../ProgressJourney'
import Text from '../../../Text'
import styled from '@emotion/native'
import {useState} from 'react'
import useContent from './useContent'
import LottieView from '../../../LottieView'
import {type LoginStackScreenProps} from '../../../../navigationTypes'
import {
  HeaderProxy,
  NextButtonProxy,
} from '../../../PageWithButtonAndProgressHeader'

const RootContainer = styled.View`
  flex: 1;
`

const TextStyled = styled(Text)`
  font-size: 24px;
  font-family: '${(p) => p.theme.fonts.ppMonument}';
  max-width: 350px;
`

const LottieViewStyled = styled(LottieView)`
  flex: 1;
`

const TextContainer = styled.View`
  height: 150px;
  justify-content: flex-end;
`

type Props = LoginStackScreenProps<'Intro'>

function Intro({navigation}: Props): JSX.Element {
  const [page, setPage] = useState(0)
  const content = useContent()
  return (
    <RootContainer>
      <HeaderProxy hidden showBackButton={false} progressNumber={1} />
      <ProgressJourney
        currentPage={page}
        numberOfPages={content.length}
        onPageChange={setPage}
        onFinish={() => {
          navigation.replace('Start')
        }}
        onSkip={() => {
          navigation.replace('Start')
        }}
      >
        <LottieViewStyled loop={false} autoPlay source={content[page].lottie} />
        <TextContainer>
          <TextStyled colorStyle={'black'}>{content[page].title}</TextStyled>
        </TextContainer>
      </ProgressJourney>
      <NextButtonProxy text={null} disabled={true} onPress={null} />
    </RootContainer>
  )
}

export default Intro

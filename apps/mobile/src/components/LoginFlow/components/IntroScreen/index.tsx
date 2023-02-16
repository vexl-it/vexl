import ProgressJourney from '../../../ProgressJourney'
import Text from '../../../Text'
import styled from '@emotion/native'
import {useState} from 'react'
import useContent from './useContent'
import {type LoginStackParamsList} from '../../index'
import {type NativeStackScreenProps} from '@react-navigation/native-stack'
import LottieView from '../../../LottieView'
import NextButtonPortal from '../NextButtonPortal'
import {useSetHeaderState} from '../../state/headerStateAtom'

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

type Props = NativeStackScreenProps<LoginStackParamsList, 'Intro'>

function Intro({navigation}: Props): JSX.Element {
  const [page, setPage] = useState(0)
  const content = useContent()
  useSetHeaderState(() => null, [])
  return (
    <RootContainer>
      <ProgressJourney
        currentPage={page}
        numberOfPages={content.length}
        onNext={setPage}
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
      <NextButtonPortal text={null} disabled={true} />
    </RootContainer>
  )
}

export default Intro

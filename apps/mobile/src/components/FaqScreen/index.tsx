import {useState} from 'react'
import Screen from '../Screen'
import {HeaderProxy} from '../PageWithButtonAndProgressHeader'
import ProgressJourney from '../ProgressJourney'
import {useNavigation} from '@react-navigation/native'
import useContent from './useContent'
import Image from '../Image'
import styled from '@emotion/native'
import Text from '../Text'
import {useTranslation} from '../../utils/localization/I18nProvider'
import IconButton from '../IconButton'
import closeSvg from '../TosScreen/images/closeSvg'

const ImageContainer = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`

const ImageStyled = styled(Image)`
  height: 100%;
  width: 100%;
`

const Header = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`

const TitleStyled = styled(Text)`
  font-size: 24px;
  font-family: '${(p) => p.theme.fonts.ppMonument}';
  margin-bottom: ${(p) => String(p.theme.spacings.xs)}px;
`

const SubtitleStyled = styled(Text)`
  font-family: '${(p) => p.theme.fonts.ttSatoshi500}';
`

function FaqsScreen(): JSX.Element {
  const {t} = useTranslation()
  const navigation = useNavigation()
  const content = useContent()
  const [page, setPage] = useState<number>(0)
  return (
    <Screen>
      <HeaderProxy hidden showBackButton={true} progressNumber={1} />
      <ProgressJourney
        currentPage={page}
        numberOfPages={content.length}
        onPageChange={setPage}
        onFinish={() => {
          navigation.goBack()
        }}
        onSkip={() => {
          navigation.goBack()
        }}
        withBackButton
      >
        <Header>
          <Text fontWeight={600}>{t('faqs.faqs')}</Text>
          <IconButton
            iconColor="grey"
            buttonType="light"
            icon={closeSvg}
            onPress={() => {
              navigation.goBack()
            }}
          />
        </Header>
        <ImageContainer>
          <ImageStyled source={content[page].svg} />
        </ImageContainer>
        <TitleStyled colorStyle={'black'}>{content[page].title}</TitleStyled>
        <SubtitleStyled colorStyle={'grayOnWhite'}>
          {content[page].text}
        </SubtitleStyled>
      </ProgressJourney>
    </Screen>
  )
}

export default FaqsScreen

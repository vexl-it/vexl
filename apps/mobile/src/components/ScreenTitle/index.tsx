import styled from '@emotion/native'
import {TitleText} from '../Text'
import closeSvg from '../TosScreen/images/closeSvg'
import IconButton from '../IconButton'

interface Props {
  onClosePress: () => void
  text: string
}

const Container = styled.View`
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  padding: ${(p) => String(p.theme.spacings.xs)}px;
  margin-bottom: ${(p) => String(p.theme.spacings.xl)}px;
`

const TitleContainer = styled.View`
  flex-shrink: 1;
`

const Title = styled(TitleText)`
  font-size: 32px;
`
function ScreenTitle({onClosePress, text}: Props): JSX.Element {
  return (
    <Container>
      <TitleContainer>
        <Title colorStyle="gray">{text}</Title>
      </TitleContainer>
      <IconButton icon={closeSvg} onPress={onClosePress} />
    </Container>
  )
}

export default ScreenTitle

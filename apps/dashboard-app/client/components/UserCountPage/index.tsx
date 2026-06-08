import styled from '@emotion/styled'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import {totalNumberOfUsersAtom} from '../../state'
import AnimatedNumber from '../AnimatedNumber'
import topAvatar from './images/avatarBasic1.svg'
import bottomAvatar from './images/avatarBasic8.svg'

const Root = styled.main`
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #000;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(32px, 6vw, 92px);
`

const Content = styled.section`
  position: relative;
  z-index: 2;
  width: min(1480px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(18px, 3vh, 30px);
  text-align: center;
`

const Count = styled(AnimatedNumber)`
  font-family: var(--font-family-sans);
  font-size: clamp(82px, 16vw, 245px);
  font-weight: 900;
  line-height: 0.82;
  color: #fff;
`

const Caption = styled.h1`
  max-width: 1500px;
  color: #fcc5f3;
  font-family: var(--font-family-serif);
  font-size: clamp(32px, 3.9vw, 74px);
  font-weight: 700;
  line-height: 1.08;
  text-align: center;
`

const AvatarImage = styled.img`
  position: absolute;
  z-index: 1;
  width: clamp(130px, 17vw, 330px);
  height: auto;
`

const TopLeftAvatar = styled(AvatarImage)`
  top: clamp(28px, 5vw, 72px);
  left: clamp(26px, 5vw, 72px);
`

const BottomRightAvatar = styled(AvatarImage)`
  right: clamp(18px, 3vw, 54px);
  bottom: clamp(18px, 3vw, 54px);
`

export default function UserCountPage(): React.ReactElement {
  const count = useAtomValue(totalNumberOfUsersAtom)

  return (
    <Root>
      <TopLeftAvatar src={topAvatar} alt="" aria-hidden="true" />
      <BottomRightAvatar src={bottomAvatar} alt="" aria-hidden="true" />
      <Content>
        <Count n={Option.getOrElse(count, () => 0)} />
        <Caption>users exchanging Bitcoin with Vexl globally</Caption>
      </Content>
    </Root>
  )
}

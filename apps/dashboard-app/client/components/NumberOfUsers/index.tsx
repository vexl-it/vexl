import Styled from '@emotion/styled'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import mobileMediaQuery from '../../mobileMediaQuery'
import {totalNumberOfUsersAtom} from '../../state'
import {useIsVerticalLayoutEnabled} from '../../utils/useIsVerticalLayoutEnabled'
import AnimatedNumber from '../AnimatedNumber'
import image from './images/something.svg'

const Root = Styled.div`
  background: #141414;
  border: 1px solid #272727;
  border-radius: 12px;
  width: 100%;
  padding: 32px 20px;
  text-align: center;
`

const Number = Styled(AnimatedNumber)<{
  verticalLayoutEnabled?: boolean
}>`
  ${(props) => (props.verticalLayoutEnabled ? `font-size: 80px` : 'font-size: 42px')};
  font-weight: 700;
  color: #fff;
  /* margin-bottom: 16px; */
  font-weight: 700;
`

const Image = Styled.img`
  width: 300px;
  display: block;
  ${mobileMediaQuery} {
    margin-inline: auto;

    width: 100%;
    max-width: 300px;
  }
`

export default function NumberOfUsers(): JSX.Element {
  const count = useAtomValue(totalNumberOfUsersAtom)
  const verticalLayoutEnabled = useIsVerticalLayoutEnabled()

  return (
    <Root>
      <Number
        verticalLayoutEnabled={verticalLayoutEnabled}
        n={Option.getOrElse(count, () => 0)}
      />
      <p>Happy anonymous users exchanging bitcoin on Vexl.it</p>
      <Image
        style={verticalLayoutEnabled ? {marginTop: '16px'} : {}}
        src={image}
      />
    </Root>
  )
}

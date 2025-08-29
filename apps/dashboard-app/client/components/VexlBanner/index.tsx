import Styled from '@emotion/styled'
import mobileMediaQuery from '../../mobileMediaQuery'
import logoWithText from './images/logoWithText.svg'
import phonePreview from './images/phonePreview.png'
import qrcode from './images/qrcode.svg'

const Root = Styled.div`
  background: var(--color-main);
  border: 1px solid #272727;
  padding: 32px 32px 0;
  display: flex;
  flex-direction: column;
  width: var(--banner-width);

  gap: 24px;
  border-radius: 12px;
  color: black;
  justify-content: space-between;
  overflow: hidden;

  ${mobileMediaQuery} {
    margin-bottom: 32px;
    /* padding: 16px; */
    width: 100%;
  }
`

const TopLogo = Styled.img`
    width: 110px;
`
const Title = Styled.h1`
    font-family: var(--font-family-serif);
    font-size: var(--banner-title-font-size);
`
const QrcodeContainer = Styled.div`
    display: flex;
    align-items: center;
    gap: 24px;
`
const Qrcode = Styled.img`
    width: 100px;
`
const QrcodeText = Styled.div`
    font-weight: 600;
    font-size: 24px;
    max-width: 15ch;
    /* max-width: 150px; */
`
const PhoneImage = Styled.img`
    align-self: center;
    /** drop shadow. x: 0 blur 40 y 4 spread 0 color #000 opacity 25% */
    filter: drop-shadow(0px 4px 40px rgba(255, 255, 255, 0.25));
  ${mobileMediaQuery} {
    margin-bottom: -75%;
    /* max-width: 100px; */
  }
`

const Content = Styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 24px;
`

export default function VexlBanner(): React.ReactElement {
  return (
    <Root>
      <Content>
        <TopLogo src={logoWithText} />
        <Title>Discreet Bitcoin.</Title>
        <QrcodeContainer>
          <Qrcode src={qrcode} />
          <QrcodeText>Scan to download Vexl app</QrcodeText>
        </QrcodeContainer>
      </Content>
      <PhoneImage src={phonePreview} />
    </Root>
  )
}

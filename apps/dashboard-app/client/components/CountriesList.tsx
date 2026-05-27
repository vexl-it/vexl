import {keyframes} from '@emotion/react'
import styled from '@emotion/styled'
import autoAnimate from '@formkit/auto-animate'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import {useEffect, useRef} from 'react'
import {getCountryInfo} from '../../common/countryInfos'
import mobileMediaQuery from '../mobileMediaQuery'
import {
  countriesToConnectionCountArrayAtom,
  maxCountryConnectionsCount,
} from '../state'
import useAnimatedValue from '../utils/useAnimatedValue'
import AnimatedNumber from './AnimatedNumber'

const Scroll = styled.div`
  position: relative;
  flex: 1;
  min-height: 0;
  display: block;
  overflow-y: auto;
  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`

const BottomSpacer = styled.div`
  height: 150px;
  /* ${mobileMediaQuery} {
    display: none;
  } */
`

const Container = styled.div`
  position: relative;
  display: flex;
  width: 100%;
  min-height: 100%;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  /* padding-right: 158px; */
  /* padding-top: 32px; */
  /* padding-bottom: 300px; */

  ${mobileMediaQuery} {
    min-height: 0;
  }
`

const slideIn = keyframes`
  from {
    width: 0;
  }
  to {
    width: var(--set-width);
  }
`

const Row = styled.div<{widthPercentage: number}>`
  width: ${(props) => props.widthPercentage}%;
  display: flex;
  align-items: center;
  gap: 12px;

  --set-width: ${(props) => props.widthPercentage}%;
  transition: width 1s;

  // Nicer animation ease in
  // Is this too much?
  /* animation: ${slideIn} 1s; */
`
// Define a keyframe animation for sliding the width

// Define the styled component
const BarContainer = styled.div`
  flex: 1;
  display: block;
  align-items: center;
`

const Bar = styled.div<{first: boolean}>`
  background: ${(props) =>
    props.first ? 'var(--color-main)' : 'var(--color-grey)'};

  color: ${(props) =>
    !props.first ? 'var(--color-white)' : 'var(--color-black)'};
  height: 33px;
  display: flex;
  width: 100%;
  border-radius: 2px 6px 6px 2px;
  flex-direction: row-reverse;
  align-items: center;
  padding: 0 12px;
`

const FlagAndName = styled.div`
  width: 155px;
  /* position: absolute; */
  right: 0;
  display: flex;
  align-items: center;
  justify-content: end;
  gap: 8px;
  /* width: 150px; */
`
const CountryFlag = styled.div`
  font-size: 36px;
  margin-top: 8px;
  line-height: 0;
`

const CountryName = styled.div`
  flex: 1;
  font-size: 12px;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const Count = styled(AnimatedNumber)`
  size: 12px;
`

const Title = styled.h2`
  margin-bottom: 12px;
`

const Text = styled.p`
  margin-bottom: 32px;
`
const Root = styled.div`
  padding-top: 32px;
  width: 100%;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  /*
  &::after {
    display: none;
  } */

  ${mobileMediaQuery} {
    height: max(70vh, 500px);
  }
`

function AnimatedBar({
  first,
  count,
}: {
  first: boolean
  count: number
}): React.ReactElement {
  const animatedWidth = useAnimatedValue(100)

  return (
    <Bar first={first} style={{width: `${animatedWidth}%`}}>
      <Count n={count} />
    </Bar>
  )
}

export default function CountriesList(): React.ReactElement {
  const maxCount = useAtomValue(maxCountryConnectionsCount)
  const barRef = useRef<HTMLDivElement>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (barRef.current) autoAnimate(barRef.current)
    if (listContainerRef.current) autoAnimate(listContainerRef.current)
  }, [barRef, listContainerRef])

  const countries = useAtomValue(countriesToConnectionCountArrayAtom)

  return (
    <Root className="fit-and-fadeout">
      <Title>Connections per country</Title>
      <Text>
        Connection is amount of connections created between you, your friends
        and friends of friends. So it is a finite potential number of P2P
        trading contacts.
      </Text>
      <Scroll>
        <Container ref={listContainerRef}>
          {countries.map((country, i) => {
            const countryInfo = getCountryInfo(country.countryCode)
            if (Option.isNone(countryInfo)) return null // TODO handle?
            return (
              <Row
                ref={barRef}
                widthPercentage={Math.round(
                  (Math.log(country.count) / Math.log(maxCount)) * 100
                )}
                key={country.countryCode}
              >
                <BarContainer>
                  <AnimatedBar
                    first={i === 0}
                    count={country.count}
                  ></AnimatedBar>
                </BarContainer>
                <FlagAndName>
                  <CountryFlag>{countryInfo.value.flag}</CountryFlag>
                  <CountryName>{countryInfo.value.name} </CountryName>
                </FlagAndName>
              </Row>
            )
          })}
          <BottomSpacer />
        </Container>
      </Scroll>
    </Root>
  )
}

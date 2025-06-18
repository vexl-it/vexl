import {keyframes} from '@emotion/react'
import styled from '@emotion/styled'
import autoAnimate from '@formkit/auto-animate'
import {Option} from 'effect'
import {useAtomValue} from 'jotai'
import {useEffect, useRef} from 'react'
import {animated, useSpring} from 'react-spring'
import {getCountryInfo} from '../../common/countryInfos'
import mobileMediaQuery from '../mobileMediaQuery'
import {
  countriesToConnectionCountArrayAtom,
  maxCountryConnectionsCount,
} from '../state'
import {useIsVerticalLayoutEnabled} from '../utils/useIsVerticalLayoutEnabled'
import AnimatedNumber from './AnimatedNumber'

const Scroll = styled.div`
  position: relative;
  flex: 1;
  display: block;
  overflow-y: scroll;

  -ms-overflow-style: none; /* IE and Edge */
  scrollbar-width: none; /* Firefox */

  &::-webkit-scrollbar {
    display: none;
  }

  ${mobileMediaQuery} {
    overflow-y: hidden;
  }
`

const BottomSpacer = styled.div`
  height: 150px;
  /* ${mobileMediaQuery} {
    display: none;
  } */
`

const Container = styled.div`
  position: absolute;
  inset: 0;
  bottom: auto;
  display: flex;
  width: 100%;
  flex-direction: column;
  gap: 12px;
  box-sizing: border-box;
  /* padding-right: 158px; */
  /* padding-top: 32px; */
  /* padding-bottom: 300px; */

  ${mobileMediaQuery} {
    position: relative;
    inset: auto;
    max-height: max(70vh, 500px);
    overflow: hidden;
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

const Bar = styled(animated.div)<{first: boolean}>`
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
  height: 800px;
  /*
  &::after {
    display: none;
  } */
`

function AnimatedBar({
  first,
  count,
}: {
  first: boolean
  count: number
}): JSX.Element {
  const springProps = useSpring({
    from: {number: 0},
    number: 100,
    delay: 200,
    config: {mass: 1, tension: 20, friction: 10},
  })

  return (
    <Bar first={first} style={{width: springProps.number.to((n) => `${n}%`)}}>
      <Count n={count} />
    </Bar>
  )
}

export default function CountriesList(): JSX.Element {
  const maxCount = useAtomValue(maxCountryConnectionsCount)
  const barRef = useRef<HTMLDivElement>(null)
  const listContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (barRef.current) autoAnimate(barRef.current)
    if (listContainerRef.current) autoAnimate(listContainerRef.current)
  }, [barRef, listContainerRef])

  const countries = useAtomValue(countriesToConnectionCountArrayAtom)
  const verticalLayoutEnabled = useIsVerticalLayoutEnabled()

  return (
    <Root
      className="fit-and-fadeout"
      style={verticalLayoutEnabled ? {height: '800px'} : {}}
    >
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

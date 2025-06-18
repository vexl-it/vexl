import styled from '@emotion/styled'
import autoAnimate from '@formkit/auto-animate'
import dayjs from 'dayjs'
import {Option} from 'effect'
import {useAtomValue, type Atom} from 'jotai'
import {splitAtom} from 'jotai/utils'
import {memo, useEffect, useRef} from 'react'
import {type UserWithConnections} from '../../common/ServerMessage'
import {getCountryInfo} from '../../common/countryInfos'
import mobileMediaQuery from '../mobileMediaQuery'
import {lastUsersAtom} from '../state'
import AnimatedNumber from './AnimatedNumber'

const Root = styled.div`
  position: absolute;
  inset: 0;
  flex-shrink: 0;
  padding-top: 32px;
  ${mobileMediaQuery} {
    position: relative;
    inset: auto;
  }
`

const Container = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
`

const Flag = styled.div`
  font-size: 36px;
  grid-column: 1 / 2;
  grid-row: 1 / 3;
`
const Connections = styled.div`
  font-size: 16px;
  font-weight: 600;
  grid-column: 3 / 4;
  grid-row: 1 / 2;
`
const Country = styled.div`
  grid-column: 3 / 4;
  grid-row: 2 / 3;
`

const Title = styled.h2`
  margin-bottom: 16px;
`

const Item = styled.div`
  padding: 10px 12px;
  background: #141414;
  border: 1px solid #272727;
  border-radius: 12px;
  display: grid;
  grid-template-columns: 32px 16px 1fr;
  grid-template-rows: 1fr 1fr;
`

const userAtoms = splitAtom(lastUsersAtom, (v) => v.pubKey)

function UserRow({
  atom,
}: {
  atom: Atom<UserWithConnections>
}): JSX.Element | null {
  const user = useAtomValue(atom)

  const country = getCountryInfo(user?.countryPrefix ?? 0)
  if (!user || Option.isNone(country)) return null

  return (
    <Item key={user.pubKey}>
      <Flag>{country.value.flag}</Flag>
      <Connections>
        <AnimatedNumber n={user.connectionsCount} /> connections
      </Connections>
      <Country>
        in {country.value.name} {dayjs.unix(user.receivedAt / 1000).fromNow()}
      </Country>
    </Item>
  )
}

const UserRowMemoized = memo(
  UserRow,
  (a1, a2) => a1.atom.toString() === a2.atom.toString()
)

function UsersList(): JSX.Element {
  const atoms = useAtomValue(userAtoms)

  return (
    <>
      {atoms.map((atom) => (
        <UserRowMemoized key={atom.toString()} atom={atom} />
      ))}
    </>
  )
}

export default function LatestConnections(): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (containerRef.current) autoAnimate(containerRef.current)
  }, [containerRef])

  return (
    <div className="fit-and-fadeout">
      <Root>
        <Title>Latest connections</Title>
        <Container ref={containerRef}>
          <UsersList />
        </Container>
      </Root>
    </div>
  )
}

import styled from '@emotion/styled'
import {useSetAtom} from 'jotai'
import {useEffect} from 'react'
import mobileMediaQuery from '../mobileMediaQuery'
import {listenForChangesActionAtom} from '../state'
import {useIsVerticalLayoutEnabled} from '../utils/useIsVerticalLayoutEnabled'
import Alert from './Alert'
import Confetti from './Confetti'
import CountriesList from './CountriesList'
import LatestConnections from './LatestConnection'
import NumberOfUsers from './NumberOfUsers'
import VexlBanner from './VexlBanner'

const Container = styled.div`
  display: flex;
  padding: 90px;
  height: 100vh;
  align-items: stretch;
  gap: 32px;

  & > * {
    display: flex;
    align-items: stretch;
  }

  ${mobileMediaQuery} {
    flex-direction: column;
    align-items: center;
    padding: 30px;
    gap: 16px;
  }
`

const LatestConnectionsAndCountContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 350px;
  align-self: stretch;

  ${mobileMediaQuery} {
    align-self: center !important;
    width: 100%;
  }
`

const CountriesContainer = styled.div`
  flex: 2;
`

const ConnectionsContainer = styled.div`
  flex: 1;
`

const CountContainer = styled.div`
  flex: 0;

  ${mobileMediaQuery} {
    /* align-self: center; */
  }
`

const BanerContainer = styled.div`
  ${mobileMediaQuery} {
    max-width: 500px;
  }
`

export default function App(): JSX.Element {
  const listenForChanges = useSetAtom(listenForChangesActionAtom)

  const verticalLayoutEnabled = useIsVerticalLayoutEnabled()

  useEffect(() => {
    const remove = listenForChanges()
    return () => {
      remove()
    }
  }, [listenForChanges])

  return (
    <>
      <Container>
        {verticalLayoutEnabled && (
          <CountContainer>
            <NumberOfUsers />
          </CountContainer>
        )}
        <CountriesContainer>
          <CountriesList />
        </CountriesContainer>
        <LatestConnectionsAndCountContainer>
          <ConnectionsContainer
            style={
              verticalLayoutEnabled
                ? {
                    width: '650px',
                    margin: '0 auto',
                  }
                : {}
            }
          >
            <LatestConnections />
          </ConnectionsContainer>
          {!verticalLayoutEnabled && (
            <CountContainer>
              <NumberOfUsers />
            </CountContainer>
          )}
        </LatestConnectionsAndCountContainer>
        <BanerContainer>
          <VexlBanner />
        </BanerContainer>
      </Container>
      <Confetti />
      <Alert />
    </>
  )
}

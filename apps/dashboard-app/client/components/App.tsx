import styled from '@emotion/styled'
import {useAtomValue, useSetAtom} from 'jotai'
import {useEffect} from 'react'
import mobileMediaQuery from '../mobileMediaQuery'
import {
  connectionStateAtom,
  dashboardBootstrappingStateAtom,
  listenForChangesActionAtom,
} from '../state'
import Alert from './Alert'
import Confetti from './Confetti'
import CountriesList from './CountriesList'
import LatestConnections from './LatestConnection'
import NumberOfUsers from './NumberOfUsers'
import VexlBanner from './VexlBanner'

const Container = styled.div`
  display: flex;
  padding: 90px;
  gap: 32px;
  height: 100vh;

  ${mobileMediaQuery} {
    flex-direction: column;
    align-items: center;
    padding: 30px;
    gap: 16px;
    height: auto;
  }
`

const CountriesContainer = styled.div`
  flex: 1;
  overflow: hidden;
`

const MiddleColumn = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;

  ${mobileMediaQuery} {
    display: contents;
  }
`

const ConnectionsContainer = styled.div`
  flex: 1;
  position: relative;
  overflow: hidden;
`

const CountContainer = styled.div`
  ${mobileMediaQuery} {
    order: -1;
  }
`

const BanerContainer = styled.div`
  overflow: hidden;

  ${mobileMediaQuery} {
    max-width: 500px;
  }
`

const LoadingOverlay = styled.div`
  position: fixed;
  inset: 0;
  z-index: 20;
  background: rgba(13, 17, 26, 0.76);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`

const LoadingCard = styled.div`
  width: min(460px, 100%);
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.96);
  color: #0e1525;
  padding: 32px 28px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  gap: 12px;
  text-align: center;
`

const LoadingTitle = styled.div`
  font-size: 28px;
  font-weight: 700;
`

const LoadingMessage = styled.div`
  font-size: 18px;
  line-height: 1.5;
  opacity: 0.84;
`

export default function App(): React.ReactElement {
  const listenForChanges = useSetAtom(listenForChangesActionAtom)
  const connectionState = useAtomValue(connectionStateAtom)
  const dashboardBootstrappingState = useAtomValue(
    dashboardBootstrappingStateAtom
  )

  useEffect(() => {
    const remove = listenForChanges()
    return () => {
      remove()
    }
  }, [listenForChanges])

  return (
    <>
      <Container>
        <CountriesContainer>
          <CountriesList />
        </CountriesContainer>
        <MiddleColumn>
          <ConnectionsContainer>
            <LatestConnections />
          </ConnectionsContainer>
          <CountContainer>
            <NumberOfUsers />
          </CountContainer>
        </MiddleColumn>
        <BanerContainer>
          <VexlBanner />
        </BanerContainer>
      </Container>
      <Confetti />
      <Alert />
      {(connectionState._tag !== 'Connected' ||
        dashboardBootstrappingState.status === 'loading') && (
        <LoadingOverlay>
          <LoadingCard>
            <LoadingTitle>Loading data</LoadingTitle>
            <LoadingMessage>
              {connectionState._tag === 'Connected'
                ? dashboardBootstrappingState.message
                : 'Connecting to dashboard updates'}
            </LoadingMessage>
          </LoadingCard>
        </LoadingOverlay>
      )}
    </>
  )
}

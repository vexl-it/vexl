import {keyframes} from '@emotion/react'
import styled from '@emotion/styled'
import {Match} from 'effect'
import {useAtomValue} from 'jotai'
import {connectionStateAtom} from '../state'

// Keyframe to slide in on display
const slideIn = keyframes`
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateY(0);
    }
`

const Wrapper = styled.div`
  position: fixed;
  bottom: 15px;
  right: 15px;
  padding: 8px 16px;
  border-radius: 12px;
  box-shadow: 0 0 10px rgba(255, 255, 255, 0.2);
`

const ErrorWrapper = styled(Wrapper)`
  background-color: #ee675e;
  animation: ${slideIn} 0.5s ease-in-out;
`

const ConnectingWrapper = styled(Wrapper)`
  background-color: var(--color-main);
  animation: ${slideIn} 0.5s ease-in-out;
`

const ConnectedWrapper = styled(Wrapper)`
  color: var(--color-black);
  font-weight: 400;
  background-color: var(--color-main);
  animation: ${slideIn} 0.5s ease-in-out;
`

export default function Alert(): React.ReactElement | null {
  const message = useAtomValue(connectionStateAtom)

  return Match.value(message).pipe(
    Match.tag('Error-Reconnecting', () => (
      <ErrorWrapper>Connection error. Reconnecting.</ErrorWrapper>
    )),
    Match.tag('Connected', () => (
      <ConnectedWrapper>Live data</ConnectedWrapper>
    )),
    Match.tag('Connecting', () => (
      <ConnectingWrapper>Connecting</ConnectingWrapper>
    )),
    Match.exhaustive
  )
}

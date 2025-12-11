import {useIsFocused} from '@react-navigation/native'
import {TYPING_INDICATION_TIMEOUT_MS} from '@vexl-next/domain/src/general/messaging'
import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue} from 'jotai'
import {useCallback, useEffect, useMemo, useRef, useState} from 'react'
import {AppState} from 'react-native'
import {createSendTypingIndicationForChatAtom} from '../../../state/chat/atoms/typingIndication'
import {useAppState} from '../../../utils/useAppState'
import {chatMolecule} from '../atoms'

const TYPING_INDICATION_INTERVAL_MS = TYPING_INDICATION_TIMEOUT_MS / 2

export function usePeriodicTypingIndication(hasText: boolean): void {
  const {chatAtom} = useMolecule(chatMolecule)
  const chat = useAtomValue(chatAtom)

  const sendTypingIndication = useAtomValue(
    useMemo(() => createSendTypingIndicationForChatAtom(chat), [chat])
  )

  const isFocused = useIsFocused()
  const [appState, setAppState] = useState(AppState.currentState)

  useAppState(
    useCallback((state) => {
      setAppState(state)
    }, [])
  )

  const shouldSend = isFocused && appState === 'active' && hasText
  const prevShouldSendRef = useRef(shouldSend)
  const wasTypingRef = useRef(false)

  // Send false when shouldSend changes from true to false
  // This handles: user cleared input, sent message, left the app, or screen lost focus
  useEffect(() => {
    if (prevShouldSendRef.current && !shouldSend) {
      sendTypingIndication(false)
      wasTypingRef.current = false
    }
    prevShouldSendRef.current = shouldSend
  }, [shouldSend, sendTypingIndication])

  // Send false on unmount if we were typing
  useEffect(() => {
    return () => {
      if (wasTypingRef.current) {
        sendTypingIndication(false)
      }
    }
  }, [sendTypingIndication])

  useEffect(() => {
    if (!shouldSend) return

    // Send immediately when conditions are met
    sendTypingIndication(true)
    wasTypingRef.current = true

    // Then send every interval
    const interval = setInterval(() => {
      sendTypingIndication(true)
    }, TYPING_INDICATION_INTERVAL_MS)
    return () => {
      clearInterval(interval)
    }
  }, [shouldSend, sendTypingIndication])
}

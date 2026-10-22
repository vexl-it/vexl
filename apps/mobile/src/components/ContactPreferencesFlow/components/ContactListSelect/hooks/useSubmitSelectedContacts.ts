import {useMolecule} from 'bunshi/dist/react'
import {Effect} from 'effect'
import {useSetAtom} from 'jotai'
import {useCallback, useEffect, useRef, useState} from 'react'
import {andThenExpectBooleanNoErrors} from '../../../../../utils/andThenExpectNoErrors'
import {runAfterKeyboardDismiss} from '../../../../../utils/dismissKeyboardPromise'
import {runAfterAnimationFrame} from '../../../../../utils/runAfterAnimationFrames'
import useSafeGoBack from '../../../../../utils/useSafeGoBack'
import {contactSelectMolecule} from '../atom'

export default function useSubmitSelectedContacts(): {
  readonly isSubmittingContacts: boolean
  readonly submitSelectedContacts: () => void
} {
  const goBack = useSafeGoBack()
  const {
    confirmSubmitHidingOffersActionAtom,
    submitAllSelectedContactsActionAtom,
  } = useMolecule(contactSelectMolecule)
  const confirmSubmitHidingOffers = useSetAtom(
    confirmSubmitHidingOffersActionAtom
  )
  const submitAllSelectedContacts = useSetAtom(
    submitAllSelectedContactsActionAtom
  )
  const [isSubmittingContacts, setIsSubmittingContacts] = useState(false)
  const isUnmountedRef = useRef(false)
  const cancelDeferredSubmitFrameRef = useRef<(() => void) | undefined>(
    undefined
  )

  useEffect(() => {
    isUnmountedRef.current = false

    return () => {
      isUnmountedRef.current = true
      cancelDeferredSubmitFrameRef.current?.()
    }
  }, [])

  const submitSelectedContacts = useCallback(() => {
    if (isSubmittingContacts) return

    // Confirm before the submitting overlay shows, so it does not sit behind
    // the dialog.
    void Effect.runPromise(confirmSubmitHidingOffers()).then((confirmed) => {
      if (!confirmed || isUnmountedRef.current) return

      setIsSubmittingContacts(true)
      runAfterKeyboardDismiss(() => {
        if (isUnmountedRef.current) return

        cancelDeferredSubmitFrameRef.current = runAfterAnimationFrame(() => {
          cancelDeferredSubmitFrameRef.current = undefined
          void Effect.runPromise(
            andThenExpectBooleanNoErrors((success) => {
              if (success) goBack()
            })(submitAllSelectedContacts())
          ).finally(() => {
            setIsSubmittingContacts(false)
          })
        })
      })
    })
  }, [
    confirmSubmitHidingOffers,
    goBack,
    isSubmittingContacts,
    submitAllSelectedContacts,
  ])

  return {
    isSubmittingContacts,
    submitSelectedContacts,
  }
}

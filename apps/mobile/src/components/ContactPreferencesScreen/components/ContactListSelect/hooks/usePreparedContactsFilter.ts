import {useMolecule} from 'bunshi/dist/react'
import {useAtomValue, useSetAtom} from 'jotai'
import {useCallback, useEffect, useRef} from 'react'
import {type ContactsFilter} from '../../../../../state/contacts/domain'
import {runAfterAnimationFrame} from '../../../../../utils/runAfterAnimationFrames'
import {contactSelectMolecule} from '../atom'

export default function usePreparedContactsFilter(
  filter: ContactsFilter | undefined
): {
  readonly selectedFilter: ContactsFilter
  readonly setSelectedFilter: (contactsFilter: ContactsFilter) => void
} {
  const {
    contactsFilterAtom,
    requestedContactsFilterAtom,
    resetContactsFilterFromRouteActionAtom,
  } = useMolecule(contactSelectMolecule)
  const selectedFilter = useAtomValue(requestedContactsFilterAtom)
  const resetContactsFilterFromRoute = useSetAtom(
    resetContactsFilterFromRouteActionAtom
  )
  const setRequestedContactsFilter = useSetAtom(requestedContactsFilterAtom)
  const applyContactsFilter = useSetAtom(contactsFilterAtom)
  const cancelDeferredFilterFrameRef = useRef<(() => void) | undefined>(
    undefined
  )

  useEffect(() => {
    const nextFilter = filter ?? 'all'

    cancelDeferredFilterFrameRef.current?.()
    cancelDeferredFilterFrameRef.current = undefined
    resetContactsFilterFromRoute(nextFilter)
  }, [filter, resetContactsFilterFromRoute])

  useEffect(() => {
    return () => {
      cancelDeferredFilterFrameRef.current?.()
    }
  }, [])

  const setSelectedFilter = useCallback(
    (nextFilter: ContactsFilter) => {
      if (selectedFilter === nextFilter) return

      setRequestedContactsFilter(nextFilter)
      cancelDeferredFilterFrameRef.current?.()
      cancelDeferredFilterFrameRef.current = runAfterAnimationFrame(() => {
        cancelDeferredFilterFrameRef.current = undefined
        applyContactsFilter(nextFilter)
      })
    },
    [applyContactsFilter, selectedFilter, setRequestedContactsFilter]
  )

  return {
    selectedFilter,
    setSelectedFilter,
  }
}

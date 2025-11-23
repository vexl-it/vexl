import type {Effect} from 'effect'
import {useCallback} from 'react'
import {runEffect} from '../services/clubsAdminApi'

export function useRunEffect() {
  return useCallback(
    <A, E>(effect: Effect.Effect<A, E>): Promise<A> => runEffect(effect),
    []
  )
}

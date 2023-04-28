import {useAppState} from '../utils/useAppState'
import {useCallback} from 'react'
import {usePrivateApiAssumeLoggedIn} from '../api'
import {useLogout} from './session'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {useStore} from 'jotai'
import reportError from '../utils/reportError'
import * as A from 'fp-ts/Array'
import {isNonEmpty} from 'fp-ts/Array'
import {myOffersAtom} from './marketplace/atom'
import notEmpty from '../utils/notEmpty'

export function useRefreshUserOnContactService(): void {
  const api = usePrivateApiAssumeLoggedIn()
  const logout = useLogout()

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return

        console.info('🦋 Refreshing user')
        void pipe(
          api.contact.refreshUser({offersAlive: true}),
          TE.match(
            (e) => {
              if (e._tag === 'UserNotFoundError') {
                console.warn('🦋 🚨 User to refresh not found. Logging out')
                logout()
              } else if (e._tag === 'NetworkError') {
                console.warn(
                  '🦋 Network error refreshing user. Not logging out.',
                  e
                )
              } else if (e._tag === 'UnknownError') {
                reportError(
                  'warn',
                  'Unknown error refreshing user. Not logging out.',
                  e
                )
                console.warn(
                  '🦋 🚨 Unknown error refreshing user. Not logging out.',
                  e._tag
                )
              } else if (e._tag === 'UnexpectedApiResponseError') {
                reportError(
                  'warn',
                  'UnexpectedApiResponseError error refreshing user. Not logging out.',
                  e
                )
                console.warn(
                  '🦋 🚨 UnexpectedApiResponseError error refreshing user. Not logging out.',
                  e._tag
                )
              } else if (e._tag === 'BadStatusCodeError') {
                const codeStartsWith4XX = e.response.status
                  .toString()
                  .startsWith('4')
                if (codeStartsWith4XX) {
                  console.warn('🦋 🚨 Bad status code while refreshing user')
                  reportError(
                    'warn',
                    'Bad status code while error refreshing user. Not logging out.',
                    e
                  )
                  logout()
                } else {
                  console.warn('🦋 🚨 Bad status code while refreshing user')
                  reportError(
                    'warn',
                    'Bad status code error refreshing user. Not logging out.',
                    e
                  )
                }
              } else {
                reportError(
                  'error',
                  'Uncaught error refreshing user. Not logging out.',
                  e
                )
                console.error(
                  '🦋 🚨 UnexpectedApiResponseError error refreshing user. Not logging out.',
                  e
                )
              }
            },
            () => {
              console.log('🦋 User refreshed')
            }
          )
        )()
      },
      [api.contact, logout]
    )
  )
}

export function useRefreshOffers(): void {
  const store = useStore()
  const api = usePrivateApiAssumeLoggedIn()

  useAppState(
    useCallback(
      (state) => {
        if (state !== 'active') return

        void pipe(
          store.get(myOffersAtom),
          A.map((offer) => offer.ownershipInfo?.adminId),
          A.filter(notEmpty),
          (o) => {
            console.info(`🦋 Refreshing ${o.length} offers`)
            return o
          },
          TE.fromPredicate(
            isNonEmpty,
            () => ({_tag: 'noOffersToRefresh'} as const)
          ),
          TE.chainW((adminIds) => api.offer.refreshOffer({adminIds})),
          TE.match(
            (l) => {
              if (l._tag === 'noOffersToRefresh') {
                console.info('🦋 No offers to refresh')
              } else {
                console.error('🦋 🚨 Error while refreshing offers', l._tag)
                reportError('warn', 'Error while refreshing offers', l)
              }
            },
            (r) => {
              console.info(`🦋 Offers refreshed`)
            }
          )
        )()
      },
      [api.offer, store]
    )
  )
}

export default function useHandleRefreshContactServiceAndOffers(): void {
  useRefreshUserOnContactService()
  useRefreshOffers()
}

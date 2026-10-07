import {Effect} from 'effect'
import {atom} from 'jotai'
import React from 'react'
import {translationAtom} from '../../utils/localization/I18nProvider'
import {
  showTrustedFriendsExplanationAtom,
  showVerifiedContactsAtom,
} from '../../utils/preferences'
import {globalDialogAtom} from '../GlobalDialog'
import TrustedFriendsExplanationContent, {
  type TrustedFriendsExplanationParams,
} from './TrustedFriendsExplanationContent'

export const showTrustedFriendsExplanationActionAtom = atom(
  null,
  (get, set, params: TrustedFriendsExplanationParams) => {
    if (!get(showVerifiedContactsAtom)) return
    const {t} = get(translationAtom)
    Effect.runFork(
      set(globalDialogAtom, {
        title: t('commonFriends.trustedFriendsExplanation.title'),
        positiveButtonText: t('common.gotIt'),
        children: React.createElement(TrustedFriendsExplanationContent, params),
      }).pipe(Effect.ignore)
    )
  }
)

export const showTrustedFriendsExplanationOnceActionAtom = atom(
  null,
  (get, set, params: TrustedFriendsExplanationParams) => {
    if (
      !get(showVerifiedContactsAtom) ||
      !get(showTrustedFriendsExplanationAtom)
    )
      return
    set(showTrustedFriendsExplanationAtom, false)
    set(showTrustedFriendsExplanationActionAtom, params)
  }
)

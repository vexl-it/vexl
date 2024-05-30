import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/lib/function'
import {useAtomValue, useSetAtom} from 'jotai'
import {focusAtom} from 'jotai-optics'
import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'
import {useTranslation} from '../utils/localization/I18nProvider'
import reportError from '../utils/reportError'
import showErrorAlert from '../utils/showErrorAlert'
import useCreateInbox from './chat/hooks/useCreateInbox'
import {useSessionAssumeLoggedIn} from './session'

export const postLoginFinishedStorageAtom = atomWithParsedMmkvStorage(
  'postLoginFinished1',
  {postLoginFinished: false},
  z.object({postLoginFinished: z.boolean()})
)
export const postLoginFinishedAtom = focusAtom(
  postLoginFinishedStorageAtom,
  (o) => o.prop('postLoginFinished')
)

export function useFinishPostLoginFlow(): () => void {
  const setFinished = useSetAtom(postLoginFinishedAtom)
  const createInbox = useCreateInbox()
  const session = useSessionAssumeLoggedIn()
  const {t} = useTranslation()

  return () => {
    void pipe(
      createInbox({inbox: {privateKey: session.privateKey}}),
      TE.match(
        (e) => {
          if (e._tag === 'ErrorInboxAlreadyExists') {
            setFinished(true)
            return
          }
          reportError('error', new Error('Error creating inbox'), {e})
          showErrorAlert({
            title: t('common.errorCreatingInbox'),
            error: e,
          })
        },
        () => {
          setFinished(true)
        }
      )
    )()
  }
}

export function useIsPostLoginFinished(): boolean {
  return useAtomValue(postLoginFinishedAtom)
}

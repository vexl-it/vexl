import {generatePrivateKey} from '@vexl-next/cryptography/src/KeyHolder'
import {generateV2KeyPair} from '@vexl-next/generic-utils/src/effect-helpers/crypto'
import {Stack} from '@vexl-next/ui'
import {Effect, Option} from 'effect'
import {atom} from 'jotai'
import {Share} from 'react-native'
import {addKeyToWaitingForAdmissionActionAtom} from '../../../state/clubs/atom/clubsToKeyHolderV2Atom'
import {generateVexlTokenActionAtom} from '../../../state/notifications/actions/generateVexlTokenActionAtom'
import {createClubAdmitionRequestLink} from '../../../utils/deepLinks/createLinks'
import {translationAtom} from '../../../utils/localization/I18nProvider'
import {getNotificationTokenE} from '../../../utils/notifications'
import reportError from '../../../utils/reportError'
import {toCommonErrorMessage} from '../../../utils/useCommonErrorMessages'
import {showErrorAlert} from '../../ErrorAlert'
import {globalDialogAtom} from '../../GlobalDialog'
import {SharableQrCode} from '../../SharableQrCode'

export const showClubAccessDialogActionAtom = atom(null, (get, set) => {
  const {t} = get(translationAtom)

  return Effect.gen(function* (_) {
    const notificationToken = yield* _(
      getNotificationTokenE(),
      Effect.map(Option.fromNullable)
    )
    const privateKey = generatePrivateKey()
    const privateKeyV2 = yield* generateV2KeyPair()
    const langCode = t('localeName')

    const vexlNotificationToken = yield* _(set(generateVexlTokenActionAtom))

    const link = createClubAdmitionRequestLink({
      langCode,
      notificationToken,
      vexlNotificationToken: Option.some(vexlNotificationToken),
      publicKey: privateKey.publicKeyPemBase64,
      publicKeyV2: privateKeyV2.publicKey,
    })

    const confirmed = yield* _(
      set(globalDialogAtom, {
        title: t('clubs.requestClubAccess'),
        subtitle: t('clubs.requestClubAccessInfo'),
        positiveButtonText: t('common.share'),
        negativeButtonText: t('common.close'),
        children: (
          <Stack alignItems="center" paddingVertical="$4">
            <SharableQrCode
              size={300}
              value={link}
              logo={require('../../images/app_logo.png')}
            />
          </Stack>
        ),
      })
    )

    if (!confirmed) return

    set(addKeyToWaitingForAdmissionActionAtom, {
      keyPair: privateKeyV2,
      oldKeyPair: privateKey,
    })

    yield* _(
      Effect.promise(async () => {
        await Share.share({message: link})
      })
    )
  }).pipe(
    Effect.catchAll((e) => {
      reportError('error', new Error('Error while requesting club access'), {e})

      showErrorAlert({
        title: t('common.somethingWentWrong'),
        description:
          toCommonErrorMessage(e, t) ??
          t('common.somethingWentWrongDescription'),
        error: e,
      })

      return Effect.void
    })
  )
})

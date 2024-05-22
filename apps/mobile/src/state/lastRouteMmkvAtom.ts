import {z} from 'zod'
import {atomWithParsedMmkvStorage} from '../utils/atomUtils/atomWithParsedMmkvStorage'

const wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom =
  atomWithParsedMmkvStorage(
    'was-last-route-before-redirect-contacts-screen',
    {
      value: false,
    },
    z.object({
      value: z.boolean().default(false),
    })
  )

export default wasLastRouteBeforeRedirectOnContactsScreenMmkvAtom

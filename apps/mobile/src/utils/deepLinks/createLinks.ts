import {type ClubAdmitionRequest} from '@vexl-next/domain/src/general/clubs'
import {type E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {type RealLifeInfo} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {parseUrlWithSearchParams} from '@vexl-next/domain/src/utility/parseUrlWithSearchParams'
import {Option, Schema} from 'effect'
import {
  MINIMAL_VERSION_IMPORT_CONTACT_V2,
  MINIMAL_VERSION_REQUEST_CLUB_ADMITION,
  VEXL_LINK_ORIGIN,
  VEXL_LINK_PATHNAME,
} from './domain'
import {
  DeepLinkImportContactV2,
  DeepLinkRequestClubAdmition,
} from './parseDeepLink'

export function createImportContactLink({
  phoneNumber,
  userData,
}: {
  phoneNumber: E164PhoneNumber
  userData: RealLifeInfo
}): string {
  return Schema.encodeSync(parseUrlWithSearchParams(DeepLinkImportContactV2))({
    origin: VEXL_LINK_ORIGIN,
    pathname: VEXL_LINK_PATHNAME,
    searchParams: {
      name: userData.userName,
      label: 'Scanned from qr code',
      numberToDisplay: phoneNumber,
      type: 'import-contact-v2',
      version: Option.some(MINIMAL_VERSION_IMPORT_CONTACT_V2),
    },
  })
}

export function createClubAdmitionRequestLink(
  payload: ClubAdmitionRequest
): string {
  return Schema.encodeSync(
    parseUrlWithSearchParams(DeepLinkRequestClubAdmition)
  )({
    origin: VEXL_LINK_ORIGIN,
    pathname: VEXL_LINK_PATHNAME,
    searchParams: {
      type: 'request-club-admition',
      version: Option.some(MINIMAL_VERSION_REQUEST_CLUB_ADMITION),
      ...payload,
    },
  })
}

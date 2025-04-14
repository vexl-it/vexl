import {SemverStringE} from '@vexl-next/domain/src/utility/SmeverString.brand'
import {Schema} from 'effect'

export const LINK_TYPE_IMPORT_CONTACT = 'import-contact'
export const LINK_TYPE_IMPORT_CONTACT_V2 = 'import-contact-v2'
export const LINK_TYPE_REQUEST_CLUB_ADMITION = 'request-club-admition'
export const LINK_TYPE_GOLDEN_GLASSES = 'golden-glasses'
export const LINK_TYPE_JOIN_CLUB = 'join-club'

export const MINIMAL_VERSION_IMPORT_CONTACT_V2 =
  Schema.decodeSync(SemverStringE)('1.30.0')
export const MINIMAL_VERSION_REQUEST_CLUB_ADMITION =
  Schema.decodeSync(SemverStringE)('1.30.0')

export const VEXL_LINK_ORIGIN = 'https://app.vexl.it'
export const VEXL_LINK_PATHNAME = 'link/'

import {LanguageCode} from '@vexl-next/domain/src/utility/LanguageCode.brand'
import {appLocaleCatalogs} from '@vexl-next/localization/src/translations'
import {Schema} from 'effect'

export const appLanguageCodes = Schema.decodeUnknownSync(
  Schema.Array(LanguageCode)
)(Object.keys(appLocaleCatalogs))

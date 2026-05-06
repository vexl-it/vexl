import {Schema} from 'effect'
import {HEADER_ADMIN_TOKEN} from './constants'

export const AdminTokenHeaders = Schema.Struct({
  [HEADER_ADMIN_TOKEN]: Schema.String,
})

export const ClearCacheTokenHeaders = AdminTokenHeaders

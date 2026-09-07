import {Schema} from 'effect'

export const SuccessHttpCode = Schema.Literals([200, 201, 202])
export const RedirectHttpCode = Schema.Literals([301, 302, 303, 307, 308])
export const ExpectedErrorHttpCode = Schema.Literals([
  400, 401, 403, 404, 409, 422,
])
export const ServerErrorHttpCode = Schema.Literals([
  500, 501, 502, 503, 504, 505,
])

export const HttpCode = Schema.Union([
  SuccessHttpCode,
  RedirectHttpCode,
  ExpectedErrorHttpCode,
  ServerErrorHttpCode,
])

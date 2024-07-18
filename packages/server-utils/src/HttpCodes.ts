import {Schema} from '@effect/schema'

export const SuccessHttpCode = Schema.Literal(200, 201, 202)
export const RedirectHttpCode = Schema.Literal(301, 302, 303, 307, 308)
export const ExpectedErrorHttpCode = Schema.Literal(
  400,
  401,
  403,
  404,
  409,
  422
)
export const ServerErrorHttpCode = Schema.Literal(500, 501, 502, 503, 504, 505)

export const HttpCode = Schema.Union(
  SuccessHttpCode,
  RedirectHttpCode,
  ExpectedErrorHttpCode,
  ServerErrorHttpCode
)

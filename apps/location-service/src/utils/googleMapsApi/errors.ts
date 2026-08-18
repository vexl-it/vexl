import {UnexpectedServerError} from '@vexl-next/domain/src/general/commonErrors'
import axios from 'axios'
import {Schema} from 'effect'

type GoogleMapsOperation = 'geocode' | 'suggest'
type GoogleMapsErrorCategory = 'RequestFailed' | 'ResponseRejected'

type GoogleMapsResponseErrorCode =
  | 'OVER_DAILY_LIMIT'
  | 'OVER_QUERY_LIMIT'
  | 'REQUEST_DENIED'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR'

export class GoogleMapsError extends Schema.TaggedError<GoogleMapsError>(
  'GoogleMapsError'
)('GoogleMapsError', {
  operation: Schema.Literal('geocode', 'suggest'),
  category: Schema.Literal('RequestFailed', 'ResponseRejected'),
  httpStatus: Schema.optional(Schema.Number),
  responseErrorCode: Schema.optional(
    Schema.Literal(
      'OVER_DAILY_LIMIT',
      'OVER_QUERY_LIMIT',
      'REQUEST_DENIED',
      'INVALID_REQUEST',
      'UNKNOWN_ERROR'
    )
  ),
  request: Schema.Unknown,
  response: Schema.optional(Schema.Unknown),
}) {}

const responseErrorCode = (
  status: unknown
): GoogleMapsResponseErrorCode | undefined => {
  switch (status) {
    case 'OVER_DAILY_LIMIT':
    case 'OVER_QUERY_LIMIT':
    case 'REQUEST_DENIED':
    case 'INVALID_REQUEST':
    case 'UNKNOWN_ERROR':
      return status
    default:
      return undefined
  }
}

const errorMessage = (
  operation: GoogleMapsOperation,
  category: GoogleMapsErrorCategory
): string => {
  switch (category) {
    case 'RequestFailed':
      return `Google Maps ${operation} request failed`
    case 'ResponseRejected':
      return `Google Maps ${operation} request was rejected`
  }
}

export const unexpectedGoogleMapsError = ({
  operation,
  category,
  error,
  request,
  response,
  responseStatus,
}: {
  operation: GoogleMapsOperation
  category: GoogleMapsErrorCategory
  error?: unknown
  request: unknown
  response?: unknown
  responseStatus?: unknown
}): UnexpectedServerError =>
  new UnexpectedServerError({
    status: 500,
    message: errorMessage(operation, category),
    cause: new GoogleMapsError({
      operation,
      category,
      httpStatus: axios.isAxiosError(error)
        ? error.response?.status
        : undefined,
      responseErrorCode: responseErrorCode(responseStatus),
      request,
      response,
    }),
  })

import {
  type InternalServerError,
  type NotFoundError,
} from '@vexl-next/domain/src/general/commonErrors'
import {Effect} from 'effect'
import {type SchemaError} from 'effect/Schema'
import {
  HttpServerResponse,
  type HttpBody,
  type HttpServerError,
} from 'effect/unstable/http'
import {type UrlParamsError} from './schemaUrlQuery'

type ErrorsToCatch =
  | HttpBody.HttpBodyError
  | SchemaError
  | HttpServerError.RequestError
  | InternalServerError
  | NotFoundError
  | UrlParamsError
  | HttpServerError.RouteNotFound

const handleCommonErrorsRouter = Effect.catch((e: ErrorsToCatch) => {
  if (e._tag === 'RouteNotFound') {
    return HttpServerResponse.json({message: 'Not found'}, {status: 404})
  }

  if (e._tag === 'SchemaError') {
    return HttpServerResponse.json({message: e.message}, {status: 400})
  }

  if (e._tag === 'RequestParseError' || e._tag === 'UrlParamsError') {
    return HttpServerResponse.json({message: e.message, status: 400})
  }

  if (e._tag === 'HttpBodyError') {
    return HttpServerResponse.json(
      {cause: 'BodyError'},
      {
        status: 500,
      }
    )
  }

  if (e._tag === 'NotFoundError') {
    return HttpServerResponse.json(
      {message: 'Not found'},
      {
        status: 404,
      }
    )
  }

  if (e._tag === 'InternalServerError') {
    return HttpServerResponse.json({cause: e.cause}, {status: 500})
  }

  // Should never happen. Why does typescript require this? Inspect it! e is `never` here :/
  return Effect.succeed(
    HttpServerResponse.text('Unknown internal server error', {status: 500})
  )
})

export default handleCommonErrorsRouter

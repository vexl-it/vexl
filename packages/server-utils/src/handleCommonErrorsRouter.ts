import {type RequestError} from '@effect/platform/Http/ServerError'
import * as Http from '@effect/platform/HttpServer'
import {type ParseError} from '@effect/schema/ParseResult'
import {
  type InternalServerError,
  type NotFoundError,
} from '@vexl-next/rest-api/src/Errors'
import {type InvalidSessionError} from './ServerUserSession'
import {type UrlParamsError} from './schemaUrlQuery'

type ErrorsToCatch =
  | InvalidSessionError
  | Http.body.BodyError
  | ParseError
  | RequestError
  | InternalServerError
  | NotFoundError
  | UrlParamsError

const handleCommonErrorsRouter = <C>(
  r: Http.router.Router<ErrorsToCatch, C>
): Http.router.Router<Http.body.BodyError, C> =>
  Http.router.catchAll(r, (e) => {
    if (e._tag === 'InvalidSessionError') {
      return Http.response.json(e, {status: 401})
    }

    if (e._tag === 'ParseError') {
      return Http.response.json({message: e.message}, {status: 400})
    }

    if (e._tag === 'RequestError' || e._tag === 'UrlParamsError') {
      return Http.response.json({message: e.message, status: 400})
    }

    if (e._tag === 'BodyError') {
      return Http.response.json(
        {cause: 'BodyError'},
        {
          status: 500,
        }
      )
    }

    if (e._tag === 'NotFoundError') {
      return Http.response.json(
        {message: 'Not found'},
        {
          status: 404,
        }
      )
    }

    if (e._tag === 'InternalServerError') {
      return Http.response.json({cause: e.cause}, {status: 500})
    }

    // Should never happen. Why does typescript require this? Inspect it! e is `never` here :/
    return Http.response.text('Unknown internal server error', {status: 500})
  })

export default handleCommonErrorsRouter

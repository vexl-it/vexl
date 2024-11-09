import {Either, Schema} from 'effect'

export const expectErrorResponse =
  (ResponseErrorSchema: Schema.Schema<any>) =>
  (failedResponse: Either.Either<any, any>) => {
    expect(failedResponse._tag).toEqual('Left')
    if (!Either.isLeft(failedResponse)) return

    expect(
      Schema.decodeUnknownEither(ResponseErrorSchema)(failedResponse.left.error)
        ._tag
    ).toEqual('Right')
  }

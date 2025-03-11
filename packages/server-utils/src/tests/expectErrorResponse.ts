import {Either, Number, Schema} from 'effect'

export const expectErrorResponse =
  (response: Schema.Schema<any> | number) =>
  (failedResponse: Either.Either<any, any>) => {
    expect(failedResponse._tag).toEqual('Left')
    if (!Either.isLeft(failedResponse)) return

    if (Number.isNumber(response)) {
      if (failedResponse._tag !== 'Left') {
        throw new Error('Expected error response')
      }
      expect(failedResponse.left.status).toEqual(response)
      return
    }

    expect(
      Schema.decodeUnknownEither(response)(failedResponse.left.error)._tag
    ).toEqual('Right')
  }

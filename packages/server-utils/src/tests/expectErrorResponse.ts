import {Either, Schema} from 'effect'

export const expectErrorResponse =
  <A, I, R>(response: Schema.Schema<A, I, R>) =>
  (failedResponse: Either.Either<any, A & any>) => {
    expect(failedResponse._tag).toEqual('Left')
    if (!Either.isLeft(failedResponse)) return

    // if (Number.isNumber(response)) {
    //   if (failedResponse._tag !== 'Left') {
    //     throw new Error('Expected error response')
    //   }
    //   expect(failedResponse.left.status).toEqual(response)
    //   return
    // }

    console.log('Failed response left:', failedResponse.left, new Error().stack)
    expect(Schema.is(response)(failedResponse.left)).toBe(true)
  }

import {Effect, HashMap, Layer, Ref} from 'effect'
import {S3Service} from '../S3Service'

export const mockedS3ServiceLayer = Layer.effect(
  S3Service,
  Effect.gen(function* (_) {
    const objects = yield* _(Ref.make(HashMap.empty<string, Uint8Array>()))

    return {
      generatePresignedUploadUrl: ({key, contentType, expiresIn = 900}) =>
        Effect.succeed({
          presignedUrl: `https://s3.example.com/presigned-url?key=${key}&contentType=${contentType}`,
          s3Key: key,
          expiresIn,
        }),
      putObject: ({key, body}) => Ref.update(objects, HashMap.set(key, body)),
      getObject: ({key}) => Effect.map(Ref.get(objects), HashMap.get(key)),
    }
  })
)

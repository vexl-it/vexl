import {ConfigProvider, Effect, Layer} from 'effect'
import {type S3Error, S3Service} from '../S3Service'

const s3Layer = S3Service.Live.pipe(
  Layer.provide(
    Layer.setConfigProvider(
      ConfigProvider.fromJson({
        S3_BUCKET_NAME: 'bucket',
        S3_ENDPOINT: 'http://192.168.1.5:9000',
        S3_FORCE_PATH_STYLE: true,
      })
    )
  )
)

const presignedUrl = async (
  effect: Effect.Effect<string, S3Error, S3Service>
): Promise<URL> =>
  await Effect.runPromise(
    effect.pipe(
      Effect.map((url) => new URL(url)),
      Effect.provide(s3Layer)
    )
  )

beforeAll(() => {
  process.env.AWS_ACCESS_KEY_ID = 'test'
  process.env.AWS_SECRET_ACCESS_KEY = 'test'
})

describe('S3Service', () => {
  it('signs content length and type into upload urls without a checksum', async () => {
    const url = await presignedUrl(
      S3Service.pipe(
        Effect.flatMap((s3) =>
          s3.generatePresignedUploadUrl({
            key: 'object-key',
            contentType: 'application/octet-stream',
            contentLength: 1024,
            expiresIn: 300,
          })
        ),
        Effect.map(({presignedUrl}) => presignedUrl)
      )
    )

    expect(url.host).toBe('192.168.1.5:9000')
    expect(url.pathname).toBe('/bucket/object-key')
    expect(url.searchParams.get('X-Amz-SignedHeaders')).toBe(
      'content-length;content-type;host'
    )
    expect(url.searchParams.get('X-Amz-Expires')).toBe('300')
    expect(
      [...url.searchParams.keys()].some((key) => key.includes('checksum'))
    ).toBe(false)
  })
})

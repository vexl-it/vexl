# Chat images

Chat images are not embedded in chat messages. The sender encrypts the image,
uploads the ciphertext to a private S3 bucket, and sends a small pointer in the
E2E encrypted chat message. The app talks to S3 directly through short-lived
presigned URLs. Chat-service only authorizes the request and signs the URL; it
never handles the bytes, the key or the plaintext.

## Flow

1. The sender generates a random single-use AES-256-GCM key
   (`generateAesKey`) and encrypts the image bytes with `aesGCMEncryptBytes`
   (`packages/cryptography/src/operations/aes.ts`). Ciphertext layout is
   `iv (12 bytes) | ciphertext | GCM auth tag (16 bytes)`.
2. The sender calls `POST /api/v1/chat-images/upload`
   (`requestChatImageUpload`) with the exact ciphertext `size`, its inbox
   public key and a signed challenge for that key. Chat-service validates the
   challenge, checks the inbox exists, picks a fresh random UUID and returns
   `{imageId, uploadUrl}`: a presigned PUT valid for 5 minutes with
   `Content-Length` (= `size`) and `Content-Type: application/octet-stream`
   signed in.
3. The sender PUTs the raw ciphertext to `uploadUrl` with exactly those
   headers. S3 rejects any other length or content type.
4. The chat message carries `ChatImageAttachment`
   (`{id, key, width, height}`, `packages/domain/src/general/messaging.ts`).
   The key travels only inside the E2E encrypted message.
5. The receiver calls `POST /api/v1/chat-images/download`
   (`requestChatImageDownload`) with `{imageId}` in the body and gets
   `{downloadUrl}`, a presigned GET valid for 5 minutes. Chat-service does not
   check that the object exists. The receiver GETs the ciphertext and decrypts
   it with `aesGCMDecryptBytes`. A 403 or 404 from S3 means the image expired
   or was never uploaded; the app shows the retry state.

Ciphertext is limited to `CHAT_IMAGE_MAX_BYTES` (5 MiB). Handlers live in
`apps/chat-service/src/routes/images/`, signing in
`packages/server-utils/src/S3Service.ts`, the app side in
`apps/mobile/src/state/chat/chatImages.ts` (`expo/fetch`, binary bodies). The
S3 requests carry no Vexl session or common headers and no cookies.

## Privacy properties

- S3 stores opaque ciphertext. Without the key from the chat message nobody,
  including us, can read the image.
- The upload request authenticates with the sender's inbox challenge only, the
  same way `sendMessage` does. It does not use the user session headers.
  Chat-service must not be able to link a user identity (phone hash, user
  public key) to inboxes, and session headers on this endpoint would do exactly
  that.
- The download request is unauthenticated. The random UUID is the capability,
  and the rate limiting middleware limits calls per IP.
- The image id goes in the request body to chat-service, never in its URL.
  URLs end up in the HTTP request log, in trace attributes (`url.full`,
  `url.query`) and in ingress access logs. With the id there, logs would show
  which IPs fetched which object.
- Chat-service does not log image ids, URLs or public keys, and the S3 signing
  spans carry no object key.
- Phones connect to S3 directly, so AWS sees client IPs and timing of every
  upload and download. Presigned URLs contain the object key, so any S3 request
  log would pair the uploader and downloaders of each image. Server access
  logging and CloudTrail S3 data events must stay off for this bucket.

## Retention

The bucket has a lifecycle rule that deletes objects after
`MESSAGE_EXPIRATION_UPPER_LIMIT_DAYS` days, the longest time a chat message can
wait on the server. There is no cleanup worker and no delete endpoint. An image
whose message was already pulled stays in the bucket until the rule removes it.

## Local dev

`pnpm dev:backend` handles everything:

- `dev.config.ts` `infra.minio.chatImagesBucket` names the bucket
  (`vexl-chat-images`).
- `minio-init` in `docker-compose.dev.yaml` creates it without anonymous access
  and imports the lifecycle rule. `CHAT_IMAGES_EXPIRE_DAYS` comes from the
  chat-service `MESSAGE_EXPIRATION_UPPER_LIMIT_DAYS` via
  `tooling/dev/docker-env.ts`. `mc ilm import` replaces the whole lifecycle
  config, so re-running init does not stack duplicate rules.
- `tooling/dev/services.ts` points chat-service at MinIO with that bucket. A
  presigned URL only works for the host it was signed for, so `S3_ENDPOINT` is
  the machine's LAN IP, reachable from the iOS simulator, the Android emulator
  and physical devices. MinIO listens on all interfaces. Without a LAN IP it
  falls back to `localhost` (iOS simulator only). See `tooling/dev/README.md`.

## Production setup

Do this for every environment (stage, prod) before shipping a client that
sends images.

1. Create a dedicated bucket per environment, e.g. `vexl-chat-images-stage`
   and `vexl-chat-images-prod`. Do not reuse the public resources bucket.
2. Turn Block Public Access on (all four settings). No bucket policy that
   grants anonymous or cross-account access.
3. Set default encryption to SSE-S3.
4. Keep server access logging and CloudTrail S3 data events for this bucket
   off. Phones call S3 directly with the object key in the URL, so those logs
   would record the requester IP per object key and pair the uploader and
   downloaders of each image.
5. Add a lifecycle rule for the whole bucket: expire current versions after
   that environment's `MESSAGE_EXPIRATION_UPPER_LIMIT_DAYS`. Leave versioning
   off. If it is on, also expire noncurrent versions after 1 day.
6. Give chat-service an IAM principal with only this policy. Presigned URLs
   act with its permissions:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject"],
         "Resource": "arn:aws:s3:::vexl-chat-images-prod/*"
       }
     ]
   }
   ```

   No `s3:ListBucket`: without it S3 answers a missing key with 403 instead of
   404, and the app treats both the same.

7. Set chat-service env:

   | Variable                                      | Value                                                      |
   | --------------------------------------------- | ---------------------------------------------------------- |
   | `S3_BUCKET_NAME`                              | the bucket from step 1                                     |
   | `AWS_REGION`                                  | bucket region (defaults to `eu-west-1`)                    |
   | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | credentials of the step 6 principal, unless a role is used |
   | `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`          | leave unset on AWS                                         |

8. No CORS configuration is needed: the native apps are not browsers.

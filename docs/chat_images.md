# Chat images

Chat images are not embedded in chat messages. The sender encrypts the image,
uploads the ciphertext to chat-service, and sends a small pointer in the E2E
encrypted chat message. Chat-service stores the ciphertext in a private S3
bucket. It never sees the key or the plaintext.

## Flow

1. The sender generates a random single-use AES-256-GCM key
   (`generateAesKey`) and encrypts the image bytes with `aesGCMEncryptBytes`
   (`packages/cryptography/src/operations/aes.ts`). Ciphertext layout is
   `iv (12 bytes) | ciphertext | GCM auth tag (16 bytes)`.
2. The sender calls `POST /api/v1/chat-images` (`uploadChatImage`) with the
   base64 ciphertext, its inbox public key and a signed challenge for that key.
   Chat-service validates the challenge, checks the inbox exists, stores the
   bytes under a fresh random UUID and returns `{imageId}`.
3. The chat message carries `ChatImageAttachment`
   (`{id, key, width, height}`, `packages/domain/src/general/messaging.ts`).
   The key travels only inside the E2E encrypted message.
4. The receiver calls `POST /api/v1/chat-images/download`
   (`downloadChatImage`) with `{imageId}` in the body, gets the base64
   ciphertext back and decrypts it with `aesGCMDecryptBytes`.

Ciphertext is limited to `CHAT_IMAGE_MAX_BYTES` (5 MiB) before base64, so the
upload body is about 7 MB. Handlers live in `apps/chat-service/src/routes/images/`,
S3 access in `packages/server-utils/src/S3Service.ts`.

## Privacy properties

- The server stores opaque ciphertext. Without the key from the chat message
  nobody, including us, can read the image.
- Upload authenticates with the sender's inbox challenge only, the same way
  `sendMessage` does. It does not use the user session headers. Chat-service
  must not be able to link a user identity (phone hash, user public key) to
  inboxes, and session headers on this endpoint would do exactly that.
- Download is unauthenticated. The random UUID is the capability, and the
  rate limiting middleware limits calls per IP.
- The image id goes in the request body, never in the URL. URLs end up in the
  HTTP request log, in trace attributes (`url.full`, `url.query`) and in
  ingress access logs. With the id there, logs would show which IPs fetched
  which object.
- Chat-service does not log image ids, data or public keys. S3 error messages
  contain only the SDK error name, because S3 errors can carry the object key.

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
- `tooling/dev/services.ts` points chat-service at MinIO with that bucket.

The app talks only to chat-service, so physical devices work without reaching
MinIO.

## Production setup

Do this for every environment (stage, prod) before shipping a client that
sends images.

1. Create a dedicated bucket per environment, e.g. `vexl-chat-images-stage`
   and `vexl-chat-images-prod`. Do not reuse the public resources bucket.
2. Turn Block Public Access on (all four settings). No bucket policy that
   grants anonymous or cross-account access.
3. Set default encryption to SSE-S3.
4. Keep server access logging and CloudTrail data events for this bucket off.
   Those logs record the requester IP per object key, which pairs uploader and
   downloader of each image.
5. Add a lifecycle rule for the whole bucket: expire current versions after
   that environment's `MESSAGE_EXPIRATION_UPPER_LIMIT_DAYS`. Leave versioning
   off. If it is on, also expire noncurrent versions after 1 day.
6. Give chat-service an IAM principal with only this policy:

   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject"],
         "Resource": "arn:aws:s3:::vexl-chat-images-prod/*"
       },
       {
         "Effect": "Allow",
         "Action": "s3:ListBucket",
         "Resource": "arn:aws:s3:::vexl-chat-images-prod"
       }
     ]
   }
   ```

   `s3:ListBucket` is required: without it S3 answers a missing (e.g. expired)
   key with 403 instead of 404, and chat-service reports a 500 error instead of
   returning `ChatImageNotFoundError`.

7. Set chat-service env:

   | Variable                                      | Value                                                      |
   | --------------------------------------------- | ---------------------------------------------------------- |
   | `S3_BUCKET_NAME`                              | the bucket from step 1                                     |
   | `AWS_REGION`                                  | bucket region (defaults to `eu-west-1`)                    |
   | `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | credentials of the step 6 principal, unless a role is used |
   | `S3_ENDPOINT`, `S3_FORCE_PATH_STYLE`          | leave unset on AWS                                         |

8. Allow request bodies of at least 8 MB on `POST /api/v1/chat-images` in the
   ingress / reverse proxy (nginx default is 1 MB:
   `nginx.ingress.kubernetes.io/proxy-body-size: 8m`). The node server itself
   accepts up to 10 MiB (`@effect/platform-node` default).
9. Check `REQUEST_TIMEOUT_MS` (default 40 s). It covers receiving the whole
   request, so a 7 MB upload needs about 1.4 Mbit/s of upstream bandwidth to
   finish in time.

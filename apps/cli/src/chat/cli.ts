import {type Command} from 'commander'
import {z} from 'zod'
import {pipe} from 'fp-ts/function'
import {safeParse} from '@vexl-next/resources-utils/dist/utils/parsing'
import * as TE from 'fp-ts/TaskEither'
import createInbox from './createInbox'
import matchAndOutputResultOrError from '../utils/matchAndOutputResultOrError'
import {PublicKeyPemBase64} from '@vexl-next/cryptography/dist/KeyHolder'
import deleteInbox from './deleteInbox'
import requestMessaging from './requestMessaging'
import approveRequest from './approveRequest'
import sendTextMessage from './sendTextMessage'
import deletePulled from './deletePulled'
import pullMessages from './pullMessages'

const CreateInboxArgs = z.object({
  keypairJson: z.string().optional(),
  credentialsJson: z.string(),
})
const DeleteInboxArgs = z.object({
  inboxKeyPairJson: z.string(),
  userCredentialsJson: z.string(),
})
const SendRequestArgs = z.object({
  message: z.string(),
  userCredentialsJson: z.string(),
  toPublicKey: PublicKeyPemBase64,
})
const ApproveRequestArgs = z.object({
  message: z.string(),
  userCredentialsJson: z.string(),
  toPublicKey: PublicKeyPemBase64,
  approve: z.boolean(),
  inboxKeyPairJson: z.string(),
})
const SendTextArgs = z.object({
  message: z.string(),
  userCredentialsJson: z.string(),
  toPublicKey: PublicKeyPemBase64,
  inboxKeyPairJson: z.string(),
})
const PullMessagesArgs = z.object({
  userCredentialsJson: z.string(),
  inboxKeyPairJson: z.string(),
})
const DeleteMessagesArgs = z.object({
  userCredentialsJson: z.string(),
  inboxKeyPairJson: z.string(),
})

export function addChatCommands(command: Command): Command {
  const subcommand = command
    .command('chat')
    .description('Chat utilities, manage inbox, send messages, etc.')

  subcommand
    .command('create-inbox')
    .description(
      'Create inbox for keypair (or generate new one if not specified)'
    )
    .option('-k, --keypair <string>', 'Inbox keypair file json')
    .requiredOption('-c --credentials <string>', 'User credentials json')
    .action(async ({keypair: keypairJson, credentials: credentialsJson}) => {
      await pipe(
        safeParse(CreateInboxArgs)({keypairJson, credentialsJson}),
        TE.fromEither,
        TE.chainW(createInbox),
        matchAndOutputResultOrError
      )()
    })

  subcommand
    .command('delete-inbox')
    .description('Delete inbox and all messages')
    .requiredOption('-c --credentials <string>', 'User credentials json')
    .requiredOption('-k, --keypair <string>', 'Inbox keypair in json')
    .action(async ({credentials, keypair}) => {
      await pipe(
        safeParse(DeleteInboxArgs)({
          userCredentialsJson: credentials,
          inboxKeyPairJson: keypair,
        }),
        TE.fromEither,
        TE.chainW(deleteInbox),
        matchAndOutputResultOrError
      )()
    })

  subcommand
    .command('send-request')
    .description('Send messaging request to another inbox')
    .requiredOption('-c --credentials <string>', 'User credentials json')
    .requiredOption(
      '--toPublicKey  <string>',
      'Public key of inbox to send the request'
    )
    .argument('<message>', 'Message to send with the request')
    .action(async (message, {credentials, toPublicKey}) => {
      await pipe(
        safeParse(SendRequestArgs)({
          userCredentialsJson: credentials,
          toPublicKey,
          message,
        }),
        TE.fromEither,
        TE.chainW(requestMessaging),
        matchAndOutputResultOrError
      )()
    })

  subcommand
    .command('approve-request')
    .description('Approve/disapprove messaging request from another inbox')
    .requiredOption('-c --credentials <string>', 'User credentials json')
    .requiredOption(
      '--toPublicKey  <string>',
      'Public key of inbox to send the request'
    )
    .requiredOption('--approve <boolean>', 'approve disapprove - true/false')
    .requiredOption('-k, --keypair <string>', 'Inbox keypair in json')
    .argument('<message>', 'Message to send with the request')
    .action(async (message, {credentials, toPublicKey, approve, keypair}) => {
      await pipe(
        safeParse(ApproveRequestArgs)({
          message,
          userCredentialsJson: credentials,
          toPublicKey,
          approve: approve.toLowerCase() === 'true',
          inboxKeyPairJson: keypair,
        }),
        TE.fromEither,
        TE.chainW(approveRequest),
        matchAndOutputResultOrError
      )()
    })

  subcommand
    .command('send-text')
    .description("Send text message to another user's inbox")
    .requiredOption('-c, --credentials <string>', 'User credentials json')
    .requiredOption(
      '--toPublicKey  <string>',
      'Public key of inbox to send the request'
    )
    .requiredOption('-k, --keypair <string>', 'Inbox keypair in json')
    .argument('<message>', 'Message to send with the request')
    .action(async (message, {credentials, toPublicKey, keypair}) => {
      await pipe(
        safeParse(SendTextArgs)({
          message,
          userCredentialsJson: credentials,
          toPublicKey,
          inboxKeyPairJson: keypair,
        }),
        TE.fromEither,
        TE.chainW(sendTextMessage),
        matchAndOutputResultOrError
      )()
    })

  subcommand
    .command('pull-messages')
    .description('Pull messages for inbox')
    .requiredOption('-c --credentials <string>', 'User credentials json')
    .requiredOption('-k, --keypair <string>', 'Inbox keypair in json')
    .action(async ({credentials, keypair}) => {
      await pipe(
        safeParse(PullMessagesArgs)({
          userCredentialsJson: credentials,
          inboxKeyPairJson: keypair,
        }),
        TE.fromEither,
        TE.chainW(pullMessages),
        matchAndOutputResultOrError
      )()
    })

  subcommand
    .command('delete-pulled')
    .description('Deletes pulled messages the network')
    .requiredOption('-c --credentials <string>', 'User credentials json')
    .requiredOption('-k, --keypair <string>', 'Inbox keypair in json')
    .action(async ({credentials, keypair}) => {
      await pipe(
        safeParse(DeleteMessagesArgs)({
          userCredentialsJson: credentials,
          inboxKeyPairJson: keypair,
        }),
        TE.fromEither,
        TE.chainW(deletePulled),
        matchAndOutputResultOrError
      )()
    })

  return command
}

import {Command} from 'commander'
import resolveFilePath from '../utils/resolveFilePath'
import fs from 'node:fs'
import {ecdsaSign, eciesEncrypt, KeyHolder} from '@vexl-next/cryptography'
import {createInbox, requestApproval, requestChallenge} from '../api/chat'
import {SignedChallenge} from '../api/chat/types'
import stripVersion from '../utils/stripVersion'

const {KeyFormat, PrivateKey} = KeyHolder

async function prepareSignedChallenge(
  privateKey: typeof PrivateKey
): Promise<SignedChallenge> {
  const {
    data: {challenge},
  } = await requestChallenge({publicKey: privateKey.exportPublicKey()})
  const signature = ecdsaSign({
    challenge,
    privateKey,
  })
  return {challenge, signature: stripVersion(signature)}
}

export function setupInboxCommands(program: Command) {
  const subprogram = program.command('inbox').description('Manage inboxes')

  subprogram
    .command('create')
    .description('Create a new inbox for given public key.')
    .option(
      '--inbox <path>',
      'Newly created inbox credentials will be saved into this file',
      './inbox.credentials'
    )
    .option(
      '-c, --credentials <path>',
      'Directory of credentials file.',
      './user.credentials.json'
    )
    .action(async (options) => {
      const inboxCredentialsFile = resolveFilePath(options.inbox)

      let privateKey: PrivateKey
      if (fs.existsSync(inboxCredentialsFile)) {
        console.info('Reading keypair from file')
        privateKey = PrivateKey.import({
          key: fs.readFileSync(inboxCredentialsFile, 'utf-8'),
          type: KeyFormat.PEM_BASE64,
        })
      } else {
        console.info('Generating new keypair')
        privateKey = PrivateKey.generate()
      }

      console.info('Creating inbox')
      const signedChallenge = await prepareSignedChallenge(privateKey)
      await createInbox({
        publicKey: privateKey.exportPublicKey(),
        signedChallenge,
      })
      console.log(
        `Inbox for ${privateKey.exportPublicKey()} created successfully.`
      )

      fs.writeFileSync(inboxCredentialsFile, privateKey.exportPrivateKey())
    })

  subprogram
    .command('request-approval')
    .description('Send request for approval to given inbox')
    .argument('<string>', 'Public key of inbox to request approval for')
    .argument('<string>', 'Message to send to inbox')
    .option(
      '--inbox <path>',
      'Inbox credentials file',
      './inbox.credentials.json'
    )
    .option(
      '-c, --credentials <path>',
      'Directory of credentials file.',
      './user.credentials.json'
    )
    .action(async (publicKey, message, options) => {
      const inboxCredentialsFile = resolveFilePath(options.inbox)
      const privateKey = PrivateKey.import({
        key: fs.readFileSync(inboxCredentialsFile, 'utf-8'),
        type: KeyFormat.PEM_BASE64,
      })

      const signedChallenge = await prepareSignedChallenge(privateKey)
      const messageToEncrypt = JSON.stringify({message})
      const encryptedMessage = eciesEncrypt({
        publicKey: publicKey,
        data: messageToEncrypt,
      })

      console.log('Sending encrypted message to inbox', {
        encryptedMessage,
        publicKey,
      })
      const {data: response} = await requestApproval({
        publicKey: privateKey.exportPublicKey(),
        message: encryptedMessage,
      })

      console.log(response)
    })

  subprogram.command('send-message')

  subprogram.command('retrieve-messages')

  subprogram.command('block-user')

  subprogram.command('approve-user')

  subprogram.command('delete-pulled-messages')

  subprogram.command('delete-inbox')
}

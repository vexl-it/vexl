import {type Command} from 'commander'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'
import {z} from 'zod'
import {safeParse} from '@vexl-next/resources-utils/dist/utils/parsing'
import {getCommonConnections, getContacts, importContacts} from './index'
import {ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
import matchAndOutputResultOrError from '../utils/matchAndOutputResultOrError'

const ImportArgs = z.object({
  contactsList: z.string(),
  credentialsJson: z.string(),
})

const FetchArgs = z.object({
  connectionLevel: ConnectionLevel,
  credentialsJson: z.string(),
})

const CommonArgs = z.object({
  credentialsJson: z.string(),
  publicKeysListString: z.string(),
})

export function addContactCommands(command: Command): Command {
  const contactSubcommand = command
    .command('contacts')
    .description('Contacts utils.')

  contactSubcommand
    .command('import')
    .description('Replace imported contacts with the ones provided.')
    .requiredOption(
      '-c , --credentials <credentials>',
      "Credentials as got from 'auth login' command."
    )
    .argument(
      '<list>',
      'List of contacts to import. Should be in +420XXXXXXXXX format, separated by comma or new line.'
    )
    .action(async (list, {credentials}) => {
      await pipe(
        safeParse(ImportArgs)({
          contactsList: list,
          credentialsJson: credentials,
        }),
        TE.fromEither,
        TE.chainW(importContacts),
        matchAndOutputResultOrError
      )()
    })

  contactSubcommand
    .command('fetch')
    .description("Fetch contact's public keys from the server")
    .requiredOption(
      '-c , --credentials <credentials>',
      "Credentials as got from 'auth login' command."
    )
    .argument(
      '[connectionLevel]',
      "Connection level to fetch. Can be 'FIRST', 'SECOND' or 'ALL'. Defaults to 'ALL'.",
      'ALL'
    )
    .action(async (connectionLevel, {credentials}) => {
      await pipe(
        safeParse(FetchArgs)({connectionLevel, credentialsJson: credentials}),
        TE.fromEither,
        TE.chainW(getContacts),
        matchAndOutputResultOrError
      )()
    })

  contactSubcommand
    .command('common')
    .description("Fetch common connections for contact's public key")
    .requiredOption(
      '-c , --credentials <credentials>',
      "Credentials as got from 'auth login' command."
    )
    .argument(
      '<publicKeysListString>',
      'List of public keys of friends to fetch common connections of. Separated by comma or new line.'
    )
    .action(async (publicKeysListString, {credentials}) => {
      await pipe(
        safeParse(CommonArgs)({
          publicKeysListString,
          credentialsJson: credentials,
        }),
        TE.fromEither,
        TE.chainW(getCommonConnections),
        matchAndOutputResultOrError
      )()
    })

  return command
}

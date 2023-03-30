import 'dotenv/config'
import {Command} from 'commander'
import {E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand.js'
import {PathString} from '@vexl-next/domain/dist/utility/PathString.brand.js'
import login from './login/index.js'
import {importContacts} from './contacts/index.js'
import createOffer from './offer/createOffer'
import {ConnectionLevel} from '@vexl-next/rest-api/dist/services/contact/contracts'
import outputDummyOffer from './offer/outputDummyOffer'
import deleteOffer from './offer/deleteOffer'
import {z} from 'zod'
import {OfferAdminId} from '@vexl-next/rest-api/dist/services/offer/contracts'
import {getNewOffers} from './offer/getNewOffers'

const program = new Command()

program
  .command('login')
  .description('Create new vexl account and save credentials into file')
  .argument('<string>', 'phone number in +420XXXXXXXXX format.')
  .option('-o, --output <string>', 'output file path')
  .action(
    async (phoneNumberRaw: string, {output: outputRaw}: {output: string}) => {
      const phoneNumber = E164PhoneNumber.parse(phoneNumberRaw)
      const output = PathString.parse(outputRaw)

      await login({phoneNumber, output})
    }
  )
program
  .command('import-contacts')
  .description('Import contacts')
  .argument(
    '<string>',
    'File with phone numbers divided by newline (format +420XXXXXXXXX).'
  )
  .option('-c, --credentials <string>', 'Path to auth file')
  .action(
    async (contactsPath: string, {credentials}: {credentials: string}) => {
      await importContacts({
        contactsPath: PathString.parse(contactsPath),
        credentialsPath: PathString.parse(credentials),
      })
    }
  )

const offerSubcommand = program
  .command('offer')
  .description(
    'Offers utils. Create, modify, delete, etc. Run `help offer` to see all subcommands.'
  )

offerSubcommand
  .command('dummy')
  .description(
    'Output dummy offer in json format. Useful for creating new offer.'
  )
  .argument('<string>', 'outputFile')
  .action((outPath: string) => {
    outputDummyOffer({outFile: PathString.parse(outPath)})
  })

offerSubcommand
  .command('create')
  .description(
    'Create a new offer and encrypt it for contacts fetched from server.'
  )
  .option('-c, --credentials <string>', 'Path to auth file')
  .option('--level <string>', 'Friend level (FIRST or SECOND)')
  .option(
    '-i, --offer <string>',
    'Path to offer file (generate dummy with `offer dummy` command)'
  )
  .option(
    '-o, --output <string>',
    'Output file path. Will save offer information into this file (like adminId, offerId and offerKey). Json formatted.'
  )
  .action(
    async ({
      credentials,
      offer,
      level,
      output,
    }: {
      credentials: string
      offer: string
      level: string
      output: string
    }) => {
      await createOffer({
        connectionLevel: ConnectionLevel.parse(level),
        outFilePath: PathString.parse(output),
        authFilePath: PathString.parse(credentials),
        offerPayloadPath: PathString.parse(offer),
      })
    }
  )

offerSubcommand
  .command('delete')
  .description('Delete an offer')
  .option('-a, --adminId <string>', 'adminId of the offer')
  .option('-c, --credentials <string>', 'Path to auth file')
  .action(async (adminId: string, {credentials}: {credentials: string}) => {
    await deleteOffer({
      adminIds: z.array(OfferAdminId).parse(adminId.split(',')),
      credentialsFilePath: PathString.parse(credentials),
    })
  })

offerSubcommand
  .command('update-public')
  .description('update public part of the offer')
  .option('-i, --offer <string>', 'Path to the offer file')
  .option('-c, --credentials <string>', 'Path to auth file')

offerSubcommand
  .command('create-private')
  .description('create private part of the offer.')
  .option(
    '--symmetricKey <string>',
    'Symmetric key used to encrypt public part of the offer'
  )
  .option(
    '--publicKey <string>',
    'Public key of user for whom the private part is created'
  )
  .option(
    '--friendLevels <string>',
    'Friend levels of whim the private part is created in relationship to me. Divided by comma.'
  )
  .option('-c, --credentials <string>', 'Path to auth file')
  .option('-a, --admin-id <string>', 'adminId of the offer')

offerSubcommand
  .command('refresh')
  .description('Refresh an offer. Prevent server from removing it.')
  .option('-a, --adminIds <string>', 'Admin ids divided by comma')
  .option('-c, --credentials <string>', 'Path to auth file')
  .action(async (adminId: string, {credentials}: {credentials: string}) => {})

offerSubcommand
  .command('get-new')
  .description('Get offers')
  .option(
    '-o, --output <string>',
    'Output file path. Will save fetched offers into this file. Json formatted'
  )
  .option('-c, --credentials <string>', 'Path to auth file')
  .option(
    '-m, --modifiedAt <string>',
    'Get offers modified/created after this date. defaults to: 2000-04-09T09:42:53.000Z.',
    '2000-04-09T09:42:53.000Z.'
  )
  .action(
    async ({
      output,
      credentials,
      modifiedAt,
    }: {
      output: string
      credentials: string
      modifiedAt: string
    }) => {
      await getNewOffers({
        outFile: PathString.parse(output),
        credentialsFile: PathString.parse(credentials),
        modifiedAt,
      })
    }
  )

const messageSubcommand = program
  .command('message')
  .description('Messages utils. Run `help message` to see all subcommands.')

messageSubcommand.command('create-inbox')

messageSubcommand.command('request')

messageSubcommand.command('respond-to-request')

messageSubcommand.command('retrieve')

messageSubcommand.command('remove-retrieved')

if (process.argv[1] === __filename) {
  program
    .parseAsync()
    .then(() => {
      console.log('Command finished')
      process.exit(0)
    })
    .catch((e) => {
      console.error('There was an error while running the command.', e)
      process.exit(1)
    })
}

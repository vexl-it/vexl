import 'dotenv/config'
import {Command} from 'commander'
import {E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand.js'
import {PathString} from '@vexl-next/domain/dist/utility/PathString.brand.js'
import login from './login/index.js'
import {importContacts} from './contacts/index.js'
import {createOffer, outputDummyOffer} from './offer'
import {FriendLevel} from '@vexl-next/domain/dist/general/offers'
import {pipe} from 'fp-ts/function'
import * as TE from 'fp-ts/TaskEither'

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
  .description('Offers utils. Create, modify, delete, etc.')

offerSubcommand
  .command('dummy')
  .description('Output dummy offer in json format.')
  .argument('<string>', 'outputFile')
  .action((outPath: string) => {
    outputDummyOffer({outFile: PathString.parse(outPath)})
  })

offerSubcommand
  .command('create')
  .description(
    'Creates new offer and encrypts it for contacts fetched from server.'
  )
  .argument('<string>', 'outputFile')
  .option('-c, --credentials <string>', 'Path to auth file')
  .option('--level <string>', 'Friend level (FIRST_DEGREE or SECOND_DEGREE)')
  .option(
    '-o, --offer <string>',
    'Path to offer file (generate dummy with `offer dummy` command)'
  )
  .action(
    async (
      outPath: string,
      {
        credentials,
        offer,
        level,
      }: {credentials: string; offer: string; level: string}
    ) => {
      await pipe(
        createOffer({
          lvl: FriendLevel.parse(level),
          authFilePath: PathString.parse(credentials),
          offerPayloadPath: PathString.parse(offer),
        }),
        TE.match(
          (error) => {
            console.log('There was an error', error)
          },
          (o) => {
            console.log('success', o)
          }
        )
      )()
    }
  )

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

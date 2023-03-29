import 'dotenv/config'
import {Command} from 'commander'
import {addContactCommands} from './contact/cli'
import {pipe} from 'fp-ts/function'
import {setLogLevel} from './utils/logging'
import {addAuthsCommands} from './auth/cli'
import {addOfferCommands} from './offer/cli'
import {addChatCommands} from './chat/cli'

const program = new Command()

program.option('-v, --verbose', 'Enable verbose logging')
program.on('option:verbose', () => {
  setLogLevel(true)
})

pipe(
  program,
  addAuthsCommands,
  addContactCommands,
  addOfferCommands,
  addChatCommands
)

if (process.argv[1] === __filename) {
  program
    .parseAsync()
    .then(() => {
      console.log('Command finished')
      process.exit(0)
    })
    .catch((e) => {
      console.log('There was an error while running the command.', e)
      process.exit(1)
    })
}

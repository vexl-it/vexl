import './utils/node19OrFail'
import './utils/setupVerbose'
import {Command} from 'commander'
import {addContactCommands} from './contact/cli'
import {pipe} from 'fp-ts/function'
import {addAuthsCommands} from './auth/cli'
import {addOfferCommands} from './offer/cli'
import {addChatCommands} from './chat/cli'

const program = new Command()

program.description(
  `Welcome to Vexl CLI tool. 
See subcommands for more info.
This tool connects to staging environment by default. 
To change environments, use the API_ENV_PRESET_KEY=(prodEnv|stageEnv) environment variable. Or setup your own by setting API_ENV to a json: with following structure: 
{
"userMs": "ServiceUrl",
"contactMs": "ServiceUrl",
"chatMs": "ServiceUrl",
"offerMs": "ServiceUrl"
}
Example usage: "API_ENV_PRESET_KEY=prodEnv node cli.js auth login +420123456789"
`
)

program.option('-v, --verbose', 'Enable verbose logging')

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

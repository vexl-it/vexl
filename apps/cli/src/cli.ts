import 'dotenv/config'
import {Command} from 'commander'
import fs from 'node:fs'
import {SecurityData} from './api/commonTypes'
import {setCredentials} from './api/credentialsSession'
import {setupLoginCommands} from './commands/user'
import resolveFilePath from './utils/resolveFilePath'
import {setupInboxCommands} from './commands/inbox'
import {KeyHolder} from '@vexl-next/cryptography'

const {PrivateKey, KeyFormat} = KeyHolder

function getCredentialsFile(path: string): SecurityData {
  const rawJson = fs.readFileSync(path, 'utf-8')
  const fileContents = JSON.parse(rawJson)
  return {
    privateKey: PrivateKey.import({
      key: fileContents.privateKey,
      type: KeyFormat.PEM_BASE64,
    }),
    hash: fileContents.hash,
    signature: fileContents.signature,
  }
}

const program = new Command()

program
  .name('Vexl cli')
  .description(' CLI for vexl app')
  .version('0.0.1')
  .hook('preAction', async (command, subcommand) => {
    const credentialsPath =
      subcommand.opts().credentials &&
      resolveFilePath(subcommand.opts().credentials)
    if (credentialsPath) {
      const credentials = getCredentialsFile(credentialsPath)
      setCredentials(credentials)
    }
  })

setupLoginCommands(program)
setupInboxCommands(program)

// Run commands only if this file is run directly
if (process.argv[1] === __filename) {
  program
    .parseAsync()
    .then(() => {
      console.log('Command finished')
      process.exit(0)
    })
    .catch((e) => {
      if (e.response) {
        // Axios error

        console.error('Command failed with request error', {
          request: {
            baseUrl: e.config.baseURL,
            method: e.config.method,
            url: e.config.url,
            data: e.config.data,
            headers: e.config.headers,
          },
          response: {
            status: e.response.status,
            data: e.response.data ? JSON.stringify(e.response.data) : null,
          },
        })
      } else {
        console.error('Command failed', e)
      }
      process.exit(1)
    })
}

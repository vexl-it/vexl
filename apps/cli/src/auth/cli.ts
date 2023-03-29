import {z} from 'zod'
import {E164PhoneNumber} from '@vexl-next/domain/dist/general/E164PhoneNumber.brand'
import {type Command} from 'commander'
import {pipe} from 'fp-ts/function'
import {safeParse} from '@vexl-next/resources-utils/dist/utils/parsing'
import * as TE from 'fp-ts/TaskEither'
import login from './index'
import matchAndOutputResultOrError from '../utils/matchAndOutputResultOrError'

const LoginArgs = z.object({
  phoneNumber: E164PhoneNumber,
})

export function addAuthsCommands(command: Command): Command {
  const authSubcommand = command
    .command('auth')
    .description('Auth actions. Login, delete user, etc...')

  authSubcommand
    .command('login')
    .description(
      'Creates new user on user service and on contacts service. Outputs credentials in json format.'
    )
    .argument('<phoneNumber>', 'Phone number in +420XXXXXXXXX format.')
    .action(async (phoneNumber) => {
      await pipe(
        safeParse(LoginArgs)({phoneNumber}),
        TE.fromEither,
        TE.chainW(login),
        matchAndOutputResultOrError
      )()
    })

  return command
}

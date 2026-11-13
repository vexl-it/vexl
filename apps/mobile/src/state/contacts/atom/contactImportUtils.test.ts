import {E164PhoneNumber} from '@vexl-next/domain/src/general/E164PhoneNumber.brand'
import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Schema} from 'effect'
import {type SessionV2} from '../../../brands/Session.brand'
import {dummySession} from '../../session/dummySesssion'
import {withoutOwnPhoneNumbers} from './contactImportUtils'

const hash = Schema.decodeSync(HashedPhoneNumber)

const session: SessionV2 = {
  ...dummySession,
  sessionCredentials: {...dummySession.sessionCredentials, hash: hash('main')},
  extraPhoneNumbers: [
    {
      phoneNumber: Schema.decodeSync(E164PhoneNumber)('+420777777777'),
      sessionCredentials: {
        ...dummySession.sessionCredentials,
        hash: hash('extra'),
      },
    },
  ],
}

it('removes every phone number of the account from contacts to import', () => {
  expect(
    withoutOwnPhoneNumbers(
      [hash('friend'), hash('main'), hash('extra'), hash('other friend')],
      session
    )
  ).toEqual([hash('friend'), hash('other friend')])
})

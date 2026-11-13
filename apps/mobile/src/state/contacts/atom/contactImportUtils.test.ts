import {HashedPhoneNumber} from '@vexl-next/domain/src/general/HashedPhoneNumber.brand'
import {Schema} from 'effect'
import {type SessionV2} from '../../../brands/Session.brand'
import {dummySession} from '../../session/dummySesssion'
import {makeExtraPhoneNumber} from '../../session/extraPhoneNumber.testUtils'
import {withoutOwnPhoneNumbers} from './contactImportUtils'

const hash = Schema.decodeSync(HashedPhoneNumber)

const session: SessionV2 = {
  ...dummySession,
  sessionCredentials: {...dummySession.sessionCredentials, hash: hash('main')},
  extraPhoneNumbers: [
    makeExtraPhoneNumber({
      phoneNumber: '+420777777777',
      hash: 'extra',
      index: 0,
    }),
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

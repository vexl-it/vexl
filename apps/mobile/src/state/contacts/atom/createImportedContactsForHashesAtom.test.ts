import {ContactHash} from '@vexl-next/domain/src/general/ContactHash.brand'
import {Option, Schema} from 'effect'
import {createStore} from 'jotai'
import {
  NonUniqueContactIdE,
  NormalizedContactValue,
  type ContactKind,
  type StoredContact,
} from '../domain'
import {contactsStoreAtom} from './contactsStore'
import createImportedContactsForHashesAtom from './createImportedContactsForHashesAtom'

jest.mock('react-native-mmkv')

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(async () => null),
    setItem: jest.fn(async () => undefined),
    removeItem: jest.fn(async () => undefined),
  },
}))

const hash = Schema.decodeSync(ContactHash)

function importedContact({
  name,
  kind,
  value,
  contactId,
}: {
  name: string
  kind: ContactKind
  value: string
  contactId?: string
}): StoredContact {
  return {
    info: {
      kind,
      name,
      label: Option.none(),
      nonUniqueContactId: Option.fromNullable(contactId).pipe(
        Option.map(Schema.decodeSync(NonUniqueContactIdE))
      ),
      rawValue: value,
    },
    computedValues: Option.some({
      normalizedValue: Schema.decodeSync(NormalizedContactValue)(value),
      hash: hash(`hash:${value}`),
    }),
    serverHashToClient: Option.none(),
    flags: {
      seen: true,
      imported: true,
      importedManually: false,
      invalidNumber: 'valid',
    },
  }
}

describe('createImportedContactsForHashesAtom', () => {
  it('shows a person once when both their phone and email match', () => {
    const store = createStore()
    store.set(contactsStoreAtom, {
      contacts: [
        importedContact({
          name: 'Alice',
          kind: 'phone',
          value: '+420777111222',
          contactId: 'alice',
        }),
        importedContact({
          name: 'Alice',
          kind: 'email',
          value: 'alice@example.com',
          contactId: 'alice',
        }),
        importedContact({
          name: 'Bob',
          kind: 'email',
          value: 'bob@example.com',
        }),
        importedContact({
          name: 'Bob',
          kind: 'phone',
          value: '+420777333444',
        }),
        importedContact({
          name: 'Carol',
          kind: 'phone',
          value: '+420777555666',
        }),
      ],
      needsFullContactsReplaceAfterContactEdit: false,
    })

    const commonFriends = store.get(
      createImportedContactsForHashesAtom([
        hash('hash:+420777111222'),
        hash('hash:alice@example.com'),
        hash('hash:bob@example.com'),
        hash('hash:+420777333444'),
      ])
    )

    expect(commonFriends.map((one) => one.info.name)).toEqual(['Alice', 'Bob'])
  })
})

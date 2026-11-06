import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Schema} from 'effect'
import {restoredUserData, userDataForBackup} from './backupUserData'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))

const mockFiles = new Map<string, string>()
jest.mock('expo-file-system', () => {
  const uriOf = (parent: {uri: string} | string, name?: string): string =>
    name === undefined
      ? String(parent)
      : `${typeof parent === 'string' ? parent : parent.uri}/${name}`

  class Directory {
    uri: string
    exists = true
    constructor(parent: {uri: string} | string, name?: string) {
      this.uri = uriOf(parent, name)
    }

    create(): void {}
  }

  class File {
    uri: string
    constructor(parent: {uri: string} | string, name?: string) {
      this.uri = uriOf(parent, name)
    }

    get extension(): string {
      return `.${this.uri.split('.').at(-1) ?? ''}`
    }

    base64Sync(): string {
      const content = mockFiles.get(this.uri)
      if (content === undefined) throw new Error('No such file')
      return content
    }

    write(content: string): void {
      mockFiles.set(this.uri, content)
    }
  }

  return {Directory, File, Paths: {document: {uri: 'file:///documents'}}}
})

const userName = Schema.decodeSync(UserName)('Satoshi')
const avatarUri = Schema.decodeSync(UriString)('file:///old/avatar.PNG')

describe('backup user data', () => {
  beforeEach(() => {
    mockFiles.clear()
  })

  it('carries the name and the avatar file itself to the restored device', () => {
    mockFiles.set(avatarUri, 'aGVsbG8=')

    const backedUp = userDataForBackup({
      userName,
      image: {type: 'imageUri', imageUri: avatarUri},
    })
    expect(backedUp).toEqual({
      userName,
      image: {base64: 'aGVsbG8=', extension: 'png'},
    })

    mockFiles.clear()
    const restored = restoredUserData(backedUp)

    expect(restored?.userName).toBe(userName)
    const restoredUri = restored?.image?.imageUri ?? ''
    expect(restoredUri).toMatch(
      /^file:\/\/\/documents\/profilePicture\/.+\.png$/
    )
    expect(mockFiles.get(restoredUri)).toBe('aGVsbG8=')
  })

  it('keeps the name when the avatar file is gone', () => {
    expect(
      userDataForBackup({
        userName,
        image: {type: 'imageUri', imageUri: avatarUri},
      })
    ).toEqual({userName, image: undefined})
  })
})

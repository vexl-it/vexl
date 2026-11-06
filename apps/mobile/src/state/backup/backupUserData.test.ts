import {UserName} from '@vexl-next/domain/src/general/UserName.brand'
import {type UserNameAndUriAvatar} from '@vexl-next/domain/src/general/UserNameAndAvatar.brand'
import {UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect, Schema} from 'effect'
import {restoredUserData, userDataForBackup} from './backupUserData'

jest.mock('react-native-mmkv')
jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn()},
}))
jest.mock('@sentry/react-native', () => ({captureException: jest.fn()}))
jest.mock('@bam.tech/react-native-image-resizer', () => ({
  __esModule: true,
  default: {
    createResizedImage: async () => ({uri: 'file:///cache/resized.jpg'}),
  },
}))

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

    delete(): void {
      mockFiles.delete(this.uri)
    }
  }

  return {
    Directory,
    File,
    Paths: {
      document: {uri: 'file:///documents'},
      cache: {uri: 'file:///cache'},
    },
  }
})

const userName = Schema.decodeSync(UserName)('Satoshi')
const avatarUri = Schema.decodeSync(UriString)('file:///old/avatar.PNG')
const resizedAvatarUri = 'file:///cache/resized.jpg'
const user: UserNameAndUriAvatar = {
  userName,
  image: {type: 'imageUri', imageUri: avatarUri},
}

describe('backup user data', () => {
  beforeEach(() => {
    mockFiles.clear()
  })

  it('carries the name and a shrunk avatar to the restored device', async () => {
    mockFiles.set(resizedAvatarUri, 'aGVsbG8=')

    const backedUp = await Effect.runPromise(userDataForBackup(user))
    expect(backedUp).toEqual({
      userName,
      image: {base64: 'aGVsbG8=', extension: 'jpeg'},
    })
    expect(mockFiles.has(resizedAvatarUri)).toBe(false)

    const restored = restoredUserData(backedUp)

    expect(restored?.userName).toBe(userName)
    const restoredUri = restored?.image?.imageUri ?? ''
    expect(restoredUri).toMatch(
      /^file:\/\/\/documents\/profilePicture\/.+\.jpeg$/
    )
    expect(mockFiles.get(restoredUri)).toBe('aGVsbG8=')
  })

  it('leaves out an avatar too large for a restorable backup', async () => {
    mockFiles.set(resizedAvatarUri, 'A'.repeat(1024 * 1024 + 4))

    expect(await Effect.runPromise(userDataForBackup(user))).toEqual({
      userName,
      image: undefined,
    })
  })

  it('keeps the name when the avatar file is gone', async () => {
    expect(await Effect.runPromise(userDataForBackup(user))).toEqual({
      userName,
      image: undefined,
    })
  })
})

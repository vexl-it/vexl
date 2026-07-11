import {Effect} from 'effect'
import {Camera, PermissionStatus} from 'expo-camera'
import {createStore} from 'jotai'
import {handleCameraPermissionsActionAtom} from './handleCameraPermissions'

jest.mock('expo-camera', () => ({
  Camera: {
    getCameraPermissionsAsync: jest.fn(),
    requestCameraPermissionsAsync: jest.fn(),
  },
  PermissionStatus: {
    GRANTED: 'granted',
    UNDETERMINED: 'undetermined',
  },
}))

jest.mock('./reportError', () => ({
  __esModule: true,
  default: jest.fn(),
}))

jest.mock('./localization/I18nProvider', () => {
  const {atom} = jest.requireActual('jotai')
  return {
    translationAtom: atom({
      t: (key: unknown) => String(key),
      isEnglish: () => true,
    }),
  }
})

describe('handleCameraPermissionsActionAtom', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('does not request camera permission when it is already granted', async () => {
    jest.mocked(Camera.getCameraPermissionsAsync).mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: PermissionStatus.GRANTED,
    })

    const effect = createStore().set(handleCameraPermissionsActionAtom)

    await expect(Effect.runPromise(effect)).resolves.toBe('granted')
    expect(Camera.requestCameraPermissionsAsync).not.toHaveBeenCalled()
  })

  it('requests camera permission when it is not granted yet', async () => {
    jest.mocked(Camera.getCameraPermissionsAsync).mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: false,
      status: PermissionStatus.UNDETERMINED,
    })
    jest.mocked(Camera.requestCameraPermissionsAsync).mockResolvedValue({
      canAskAgain: true,
      expires: 'never',
      granted: true,
      status: PermissionStatus.GRANTED,
    })

    const effect = createStore().set(handleCameraPermissionsActionAtom)

    await expect(Effect.runPromise(effect)).resolves.toBe('granted')
    expect(Camera.requestCameraPermissionsAsync).toHaveBeenCalledTimes(1)
  })
})

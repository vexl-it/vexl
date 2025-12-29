import dotenv from 'dotenv'

dotenv.config({path: '.env.test'})

// TODO: try to remove with never versions of EXPO and @effect/platform-node and node
// Fix for failing tests on remote
// Polyfill File global for @effect/platform-node
if (typeof global.File === 'undefined') {
  global.File = class File {
    webkitRelativePath = ''

    async bytes(): Promise<Uint8Array> {
      return new Uint8Array()
    }
  } as any
}

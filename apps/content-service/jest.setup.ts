import dotenv from 'dotenv'

dotenv.config({path: '.env.test'})

jest.mock('nanoid', () => ({nanoid: () => 'mocked-id'}))
jest.mock('url-join', () => {
  return {
    __esModule: true,
    default: (...args: string[]) => args.join('/'),
  }
})

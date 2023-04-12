import {setLogLevel} from './logging'

const args = process.argv.slice(2)
if (args.includes('-v')) {
  setLogLevel(true)
}

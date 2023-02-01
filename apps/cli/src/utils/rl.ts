import readline from 'node:readline/promises'

import {stdin as input, stdout as output} from 'node:process'

export default readline.createInterface({input, output})

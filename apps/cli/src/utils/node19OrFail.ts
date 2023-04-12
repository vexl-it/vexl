const REQUIRED_VERSION = 19

const currentNodeVersion = Number(process.version.match(/^v(\d+)/)?.[1])

if (currentNodeVersion < REQUIRED_VERSION) {
  console.error(`You are running Node ${process.version}.`)
  console.error(
    `Vexl cli requires Node ${REQUIRED_VERSION} or higher. \nPlease update your version of Node. \nYou can use nvm to manage multiple versions of NodeJS on your environment.`
  )
  process.exit(1)
}

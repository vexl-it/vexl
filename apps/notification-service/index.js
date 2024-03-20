import {createServer} from 'node:http'

const port = 3000
const server = createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(`{"publicKey": "${process.env.FCM_TOKEN_PUBLIC_KEY}"}`)
})

server.listen(port, () => {
  console.log(`Server running at port: ${port}`)
})

// health server
const healthPort = 3001
const healthServer = createServer((req, res) => {
  res.statusCode = 200
  res.setHeader('Content-Type', 'application/json')
  res.end(`{"status": "ok"}`)
})
healthServer.listen(healthPort, () => {
  console.log(`Health server running at port: ${healthPort}`)
})

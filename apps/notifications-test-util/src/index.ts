import 'dotenv/config'
import './sourcemapSupport'

import * as admin from 'firebase-admin'
import {initializeApp} from 'firebase-admin/app'
import {getMessaging} from 'firebase-admin/messaging'

async function main(): Promise<void> {
  // console.log(process.env.FIREBASE_CONFIG)
  const credentialsJson = JSON.parse(String(process.env.FIREBASE_CREDS))
  initializeApp({
    credential: admin.credential.cert(credentialsJson),
  })

  const token = process.argv[2]
  if (!token) {
    throw new Error('Missing token')
  }

  console.log(`Sending notification to: ${token}.`)

  // //
  // await getMessaging().send({
  //   token,
  //   data: {
  //     type: 'TEST',
  //   },
  //   android: {
  //     priority: 'high',
  //   },
  //   apns: {
  //     payload: {
  //       aps: {
  //         'content-available': true,
  //       },
  //     },
  //     headers: {
  //       'apns-push-type': 'background',
  //       'apns-priority': '5',
  //       'apns-topic': 'it.vexl.next', // your app bundle identifier
  //     },
  //   },
  // })

  await getMessaging().send({
    token,
    data: {
      type: 'NEW_APP_USER',
    },
    apns: {
      payload: {
        aps: {
          'content-available': true,
        },
      },
    },
  })
  console.log('Notification sent')
}

void main()

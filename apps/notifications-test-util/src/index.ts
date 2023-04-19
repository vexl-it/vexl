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

  //
  await getMessaging().send({
    token,
    notification: {
      title: 'You have got a message',
      body: 'Someone has sent you a chat message',
    },
    data: {
      title: 'Vexl is still here',
      body: 'alright',
      customNotif: 'true',
    },
    android: {
      priority: 'high',
    },
    apns: {
      payload: {
        aps: {
          'content-available': true,
        },
      },
      headers: {
        'apns-push-type': 'background',
        'apns-priority': '5',
        'apns-topic': 'it.vexl.next', // your app bundle identifier
      },
    },
  })
  console.log('Notification sent')
}

void main()

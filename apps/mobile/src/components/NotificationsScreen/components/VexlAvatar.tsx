import {Avatar} from '@vexl-next/ui'
import React from 'react'

const vexlAvatar = require('../images/avatar.png') as number

function VexlAvatar(): React.ReactElement {
  return <Avatar size="small" customSize={36} source={vexlAvatar}></Avatar>
}

export default VexlAvatar

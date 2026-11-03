import {Avatar} from '@vexl-next/ui'
import React from 'react'

const vexlAvatar = require('../images/avatar.png') as number

function VexlAvatar(): React.ReactElement {
  return <Avatar size="$9" source={vexlAvatar} />
}

export default VexlAvatar

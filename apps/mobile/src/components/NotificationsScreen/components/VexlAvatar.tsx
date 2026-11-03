import {Avatar} from '@vexl-next/ui'
import React from 'react'

const vexlAvatar: number = require('../images/avatar.png')

function VexlAvatar(): React.ReactElement {
  return <Avatar size="$9" source={vexlAvatar} />
}

export default VexlAvatar

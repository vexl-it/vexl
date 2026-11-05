import React from 'react'
import {MatterCanvas} from './MatterCanvas'

export function PhysicsSection(): React.JSX.Element {
  return (
    <div className="section is-canvas-test">
      <div className="container is-canvas-test">
        <div className="hider right" />
        <div className="hider top" />
        <div className="hider" />
        <div className="canvas-embed w-embed">
          <MatterCanvas />
        </div>
      </div>
    </div>
  )
}

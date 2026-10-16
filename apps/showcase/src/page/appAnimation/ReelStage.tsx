import {Typography, VexlTextGraphic} from '@vexl-next/ui'
import type {ReactNode} from 'react'
import {PhoneFrame} from '../../demos/shared/PhoneFrame'
import {useScaleToWidth} from '../../demos/shared/useScaleToWidth'

// A third of a 1080×1920 reel, scaled to the stage's width.
const reelWidth = 360
const reelHeight = 640

/** The reel frame: logo and caption on Vexl yellow above the bare phone screen, then a logo end card. */
export function ReelStage({
  caption,
  ended,
  children,
}: {
  caption: string
  ended: boolean
  children: ReactNode
}): React.JSX.Element {
  const [ref, scale] = useScaleToWidth<HTMLDivElement>(reelWidth)
  return (
    <div ref={ref} className="reel">
      <div
        className="reel-canvas"
        style={{
          width: reelWidth,
          height: reelHeight,
          transform: `scale(${scale})`,
        }}
      >
        <VexlTextGraphic variant="dark" width={68} height={21} />
        <div key={caption} className="reel-caption demo-arrive">
          <Typography variant="titles" color="$black100" textAlign="center">
            {caption}
          </Typography>
        </div>
        <div className="reel-screen">
          <PhoneFrame bezel={false}>{children}</PhoneFrame>
        </div>
        {ended ? (
          <div className="reel-end">
            <VexlTextGraphic variant="dark" width={200} height={61} animate />
          </div>
        ) : null}
      </div>
    </div>
  )
}

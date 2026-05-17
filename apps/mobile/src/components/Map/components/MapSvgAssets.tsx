import React from 'react'
import Svg, {
  Defs,
  Ellipse,
  FeBlend,
  FeFlood,
  FeGaussianBlur,
  Filter,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg'

export function MapPinAsset({
  color,
  size = 70,
}: {
  color: string
  size?: number
}): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 68 65" fill="none">
      <Ellipse
        opacity={0.66}
        cx={34}
        cy={47.0932}
        rx={22}
        ry={5.86667}
        fill="black"
        filter="url(#pinShadow)"
      />
      <Path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M34.7333 41.9147C37.8699 39.0391 49.9999 27.1946 49.9999 15.9998C49.9999 7.16337 42.8365 0 34.0001 0C25.1636 0 18.0002 7.16337 18.0002 15.9998C18.0002 26.9524 30.145 38.9894 33.2726 41.9076C33.688 42.2952 34.3145 42.2987 34.7333 41.9147ZM34.0002 21.1428C36.5249 21.1428 38.5716 19.0961 38.5716 16.5714C38.5716 14.0467 36.5249 12 34.0002 12C31.4755 12 29.4289 14.0467 29.4289 16.5714C29.4289 19.0961 31.4755 21.1428 34.0002 21.1428Z"
        fill={color}
      />
      <Defs>
        <Filter
          id="pinShadow"
          x={0.266666}
          y={29.4932}
          width={67.4667}
          height={35.1991}
        >
          <FeFlood floodOpacity={0} result="BackgroundImageFix" />
          <FeBlend
            mode="normal"
            in="SourceGraphic"
            in2="BackgroundImageFix"
            result="shape"
          />
          <FeGaussianBlur
            stdDeviation={5.86667}
            result="effect1_foregroundBlur"
          />
        </Filter>
      </Defs>
    </Svg>
  )
}

export function RadiusRingAsset({
  color,
  size = 343,
}: {
  color: string
  size?: number | string
}): React.ReactElement {
  return (
    <Svg width={size} height={size} viewBox="0 0 343 343" fill="none">
      <Path
        d="M343 171.5C343 266.217 266.217 343 171.5 343C76.7832 343 0 266.217 0 171.5C0 76.7832 76.7832 0 171.5 0C266.217 0 343 76.7832 343 171.5Z"
        fill="url(#radiusGradient)"
      />
      <Path
        d="M342 171.5C342 265.665 265.665 342 171.5 342C77.3355 342 1 265.665 1 171.5C1 77.3355 77.3355 1 171.5 1C265.665 1 342 77.3355 342 171.5Z"
        stroke={color}
        strokeWidth={2}
      />
      <Defs>
        <RadialGradient
          id="radiusGradient"
          cx={0}
          cy={0}
          r={1}
          gradientUnits="userSpaceOnUse"
          gradientTransform="translate(171.5 171.5) rotate(90) scale(171.5)"
        >
          <Stop stopColor={color} stopOpacity={0} />
          <Stop offset={0.932292} stopColor={color} stopOpacity={0.15} />
          <Stop offset={1} stopColor={color} stopOpacity={0.33} />
        </RadialGradient>
      </Defs>
    </Svg>
  )
}

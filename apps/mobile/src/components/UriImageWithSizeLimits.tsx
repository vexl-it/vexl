import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import {Effect} from 'effect'
import React, {useEffect, useState} from 'react'
import {Image as TmImage} from 'tamagui'
import {getImageSize} from '../utils/fpUtils'
import getImageDimensionsWithinLimits from '../utils/getImageDimensionsWithLimits'

interface Props {
  uri: UriString
  limits: {width: number; height: number}
}

function UriImageWithSizeLimits({uri, limits}: Props): React.ReactElement {
  const [dimensions, setDimensions] = useState({width: 0, height: 0})

  useEffect(() => {
    void Effect.gen(function* (_) {
      const originalDimensions = yield* _(getImageSize(uri))
      setDimensions(getImageDimensionsWithinLimits(originalDimensions, limits))
    }).pipe(Effect.runPromise)
  }, [uri, setDimensions, limits])

  return (
    <TmImage
      width={dimensions.width}
      height={dimensions.height}
      objectFit="contain"
      source={{uri}}
    />
  )
}

export default UriImageWithSizeLimits

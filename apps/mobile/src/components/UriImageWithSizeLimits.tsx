import {type UriString} from '@vexl-next/domain/src/utility/UriString.brand'
import React, {useEffect, useState} from 'react'
import {Image as TmImage} from 'tamagui'
import {getImageSize} from '../utils/fpUtils'
import * as TE from 'fp-ts/TaskEither'
import {pipe} from 'fp-ts/function'
import getImageDimensionsWithinLimits from '../utils/getImageDimensionsWithLimits'

interface Props {
  uri: UriString
  limits: {width: number; height: number}
}

function UriImageWithSizeLimits({uri, limits}: Props): JSX.Element {
  const [dimensions, setDimensions] = useState({width: 0, height: 0})

  useEffect(() => {
    void pipe(
      getImageSize(uri),
      TE.map((originalDimensions) => {
        setDimensions(
          getImageDimensionsWithinLimits(originalDimensions, limits)
        )
      })
    )()
  }, [uri, setDimensions, limits])

  return (
    <TmImage
      width={dimensions.width}
      height={dimensions.height}
      resizeMode="contain"
      source={{uri}}
    />
  )
}

export default UriImageWithSizeLimits

import React, {useCallback, useEffect, useRef, useState} from 'react'
import {InteractionManager, View} from 'react-native'

const BATCH_SIZE = 1

interface Props {
  children: React.ReactNode[]
  displayOnProgress?: React.ReactNode
}

export default function ChunkView({
  children,
  displayOnProgress,
}: Props): JSX.Element {
  const [batchIndex, setBatchIndexRaw] = useState(1)
  const focusedRef = useRef(true)
  const batchIndexRef = useRef(1)
  const reachedEndRef = useRef(false)

  const childrenChunk = reachedEndRef.current
    ? children
    : children?.slice(0, BATCH_SIZE * batchIndex) ?? null

  const loadNextBatch = useCallback(
    (timeout: number = 5) => {
      const setBatchIndex = (index: number): void => {
        batchIndexRef.current = index
        setBatchIndexRaw(index)
      }

      void InteractionManager?.runAfterInteractions(() => {
        setTimeout(() => {
          if (focusedRef.current) {
            const nextBatchIndex = batchIndexRef.current + 1
            if (nextBatchIndex * BATCH_SIZE >= children.length) {
              reachedEndRef.current = true
            } else {
              loadNextBatch()
            }
            setBatchIndex(nextBatchIndex)
          }
        }, timeout)
      })
      return () => (focusedRef.current = true)
    },
    [children.length]
  )

  useEffect(() => {
    loadNextBatch()
  }, [loadNextBatch])

  return (
    <>
      {!reachedEndRef.current && (displayOnProgress ?? null)}
      <View
        style={{
          display: !reachedEndRef.current ? 'none' : 'flex',
        }}
      >
        {childrenChunk}
      </View>
    </>
  )
}

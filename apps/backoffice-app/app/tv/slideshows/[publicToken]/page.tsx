'use client'

import {getPublicSlideshow} from '@/src/services/slideshows/api'
import {
  type SlideshowSlide,
  type TvSlideshow,
} from '@/src/services/slideshows/domain'
import {Array, pipe} from 'effect'
import {useParams} from 'next/navigation'
import {useCallback, useEffect, useMemo, useState} from 'react'

const SlideFallback = ({message}: {readonly message: string}) => (
  <div className="flex h-screen w-screen items-center justify-center bg-black p-8 text-center text-sm text-white">
    {message}
  </div>
)

function SlideView({slide}: {readonly slide: SlideshowSlide}) {
  const [iframeFailed, setIframeFailed] = useState(false)

  useEffect(() => {
    setIframeFailed(false)
  }, [slide.uuid])

  switch (slide.type) {
    case 'image':
      return (
        <img
          src={slide.url}
          alt=""
          className={`h-screen w-screen bg-black ${
            slide.fit === 'cover' ? 'object-cover' : 'object-contain'
          }`}
        />
      )
    case 'video':
      return (
        <video
          src={slide.url}
          className="h-screen w-screen bg-black object-contain"
          autoPlay
          muted
          loop
          playsInline
        />
      )
    case 'website':
      return iframeFailed ? (
        <SlideFallback message="This website cannot be displayed here." />
      ) : (
        <iframe
          src={slide.url}
          title="Website slide"
          sandbox="allow-scripts allow-same-origin"
          className="h-screen w-screen border-0 bg-black"
          onError={() => {
            setIframeFailed(true)
          }}
        />
      )
  }
}

export default function TvSlideshowPage() {
  const params = useParams<{publicToken: string}>()
  const [slideshow, setSlideshow] = useState<TvSlideshow | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const loadSlideshow = useCallback(async () => {
    try {
      const result = await getPublicSlideshow(params.publicToken)
      setSlideshow(result.slideshow)
      setError(null)
      setCurrentIndex((index) =>
        index >= result.slideshow.slides.length ? 0 : index
      )
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Slideshow unavailable'
      )
    }
  }, [params.publicToken])

  useEffect(() => {
    void loadSlideshow()
  }, [loadSlideshow])

  const currentSlide = useMemo(() => {
    if (!slideshow || !Array.isNonEmptyReadonlyArray(slideshow.slides)) {
      return null
    }
    return slideshow.slides[currentIndex] ?? slideshow.slides[0]
  }, [currentIndex, slideshow])

  const activeIndex = useMemo(() => {
    if (!slideshow || !Array.isNonEmptyReadonlyArray(slideshow.slides)) {
      return null
    }

    return currentIndex >= slideshow.slides.length ? 0 : currentIndex
  }, [currentIndex, slideshow])

  const goToNextSlide = useCallback(() => {
    if (!slideshow || slideshow.slides.length === 0) return

    setCurrentIndex((index) => {
      const nextIndex = index + 1 >= slideshow.slides.length ? 0 : index + 1
      if (nextIndex === 0) void loadSlideshow()
      return nextIndex
    })
  }, [loadSlideshow, slideshow])

  const goToPreviousSlide = useCallback(() => {
    if (!slideshow || slideshow.slides.length === 0) return

    setCurrentIndex((index) =>
      index - 1 < 0 ? slideshow.slides.length - 1 : index - 1
    )
  }, [slideshow])

  useEffect(() => {
    if (!slideshow || !currentSlide) return

    const timeout = window.setTimeout(
      goToNextSlide,
      currentSlide.durationSeconds * 1000
    )

    return () => {
      window.clearTimeout(timeout)
    }
  }, [currentSlide, goToNextSlide, slideshow])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        goToNextSlide()
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        goToPreviousSlide()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [goToNextSlide, goToPreviousSlide])

  if (error) return <SlideFallback message={error} />
  if (!slideshow) return <SlideFallback message="Loading..." />
  if (!currentSlide) return <SlideFallback message="No slides configured." />

  return (
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      {pipe(
        slideshow.slides,
        Array.map((slide, slideIndex) => {
          const isActive = slideIndex === activeIndex

          return (
            <div
              key={slide.uuid}
              aria-hidden={!isActive}
              className={`absolute inset-0 h-screen w-screen bg-black ${
                isActive
                  ? 'visible z-10 opacity-100'
                  : 'invisible z-0 opacity-0'
              }`}
            >
              <SlideView slide={slide} />
            </div>
          )
        })
      )}
    </main>
  )
}

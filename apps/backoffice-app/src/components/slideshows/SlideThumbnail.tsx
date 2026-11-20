import {cx, GlobeIcon, ImageIcon, VideoIcon} from '@/src/components/ui'
import {type SlideshowSlide} from '@/src/services/slideshows/domain'
import {type ReactNode} from 'react'

export const SLIDE_TYPES = {
  image: {label: 'Image', Icon: ImageIcon, accept: '.png,.jpg,.jpeg,.webp'},
  video: {label: 'Video', Icon: VideoIcon, accept: '.mp4,.webm'},
  website: {label: 'Website', Icon: GlobeIcon, accept: ''},
}

const hostnameOf = (url: string): string => {
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}

function SlideStill({
  slide,
  onVideoSeconds,
}: {
  readonly slide: SlideshowSlide
  readonly onVideoSeconds?: (seconds: number) => void
}) {
  const {Icon} = SLIDE_TYPES[slide.type]

  if (slide.type === 'website' || !slide.url)
    return (
      <div className="flex size-full flex-col items-center justify-center gap-1 px-2 text-white/60">
        <Icon className="size-5" />
        {slide.type === 'website' ? (
          <span className="max-w-full truncate text-xs">
            {hostnameOf(slide.url)}
          </span>
        ) : null}
      </div>
    )

  if (slide.type === 'image')
    return (
      <img
        src={slide.url}
        alt=""
        loading="lazy"
        className={cx(
          'size-full',
          slide.fit === 'cover' ? 'object-cover' : 'object-contain'
        )}
      />
    )

  return (
    <video
      // The fragment makes the browser paint a frame instead of a blank box.
      src={`${slide.url}#t=0.1`}
      preload="metadata"
      muted
      playsInline
      className="size-full object-contain"
      onLoadedMetadata={({currentTarget: {duration}}) => {
        if (Number.isFinite(duration)) onVideoSeconds?.(Math.ceil(duration))
      }}
    />
  )
}

/** A still 16:9 frame of a slide, framed the way the TV shows it. */
export function SlideThumbnail({
  slide,
  className,
  onVideoSeconds,
  children,
}: {
  readonly slide: SlideshowSlide | undefined
  readonly className?: string
  readonly onVideoSeconds?: (seconds: number) => void
  readonly children?: ReactNode
}) {
  return (
    <div
      className={cx(
        'relative aspect-video overflow-hidden rounded-control',
        slide ? 'bg-ink' : 'border border-dashed border-line-strong bg-canvas',
        className
      )}
    >
      {slide ? (
        <SlideStill slide={slide} onVideoSeconds={onVideoSeconds} />
      ) : null}
      {children}
    </div>
  )
}

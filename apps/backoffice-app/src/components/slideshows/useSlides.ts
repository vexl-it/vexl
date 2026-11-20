import {uploadSlideshowFile} from '@/src/services/slideshows/api'
import {
  FileExtension,
  ImageExtension,
  SlideDurationSeconds,
  type SlideshowSlide,
  type SlideshowSlides,
} from '@/src/services/slideshows/domain'
import {HttpsUrl} from '@/src/services/urlSchemas'
import {Array, Either, Option, pipe, Record, Schema} from 'effect'
import {useCallback, useState} from 'react'

export type UploadState = {readonly progress: number} | {readonly error: string}

export const isUploading = (
  upload: UploadState | undefined
): upload is {readonly progress: number} =>
  upload !== undefined && 'progress' in upload

const DEFAULT_DURATION_SECONDS = 15

const fileExtensionOf = (file: File): Option.Option<FileExtension> =>
  Schema.decodeUnknownOption(FileExtension)(
    file.name.split('.').pop()?.toLowerCase()
  )

const mediaTypeOf = (extension: FileExtension): 'image' | 'video' =>
  Schema.is(ImageExtension)(extension) ? 'image' : 'video'

const newSlide = (type: SlideshowSlide['type']): SlideshowSlide => {
  const base = {
    uuid: crypto.randomUUID(),
    durationSeconds: DEFAULT_DURATION_SECONDS,
  }
  switch (type) {
    case 'image':
      return {...base, type, url: '', s3Key: '', fit: 'cover'}
    case 'video':
      return {...base, type, url: '', s3Key: ''}
    case 'website':
      return {...base, type, url: 'https://'}
  }
}

export interface SlideError {
  readonly field: 'media' | 'url' | 'duration'
  readonly message: string
}

export const slideError = (slide: SlideshowSlide): SlideError | null => {
  if (slide.type === 'website') {
    if (!Schema.is(HttpsUrl)(slide.url))
      return {field: 'url', message: 'Enter a full https:// address'}
  } else if (!slide.url) {
    return {
      field: 'media',
      message: `Upload ${slide.type === 'image' ? 'an image' : 'a video'} first`,
    }
  }
  return Schema.is(SlideDurationSeconds)(slide.durationSeconds)
    ? null
    : {
        field: 'duration',
        message: 'Duration must be a whole number between 1 and 86400 seconds',
      }
}

/** The slide list being edited, with the uploads that fill its media slides. */
export function useSlides(
  slideshowUuid: string,
  initialSlides: SlideshowSlides
) {
  const [slides, setSlides] = useState(initialSlides)
  const [uploads, setUploads] = useState<
    Record.ReadonlyRecord<string, UploadState>
  >({})
  const [rejectedFiles, setRejectedFiles] = useState<readonly string[]>([])

  const update = useCallback(
    (uuid: string, change: (slide: SlideshowSlide) => SlideshowSlide) => {
      setSlides(
        Array.map((slide) => (slide.uuid === uuid ? change(slide) : slide))
      )
    },
    []
  )

  const upload = useCallback(
    async (uuid: string, file: File, fileExtension: FileExtension) => {
      const setUpload = (state: UploadState) => {
        setUploads(Record.set(uuid, state))
      }
      setUpload({progress: 0})

      try {
        const {assetUrl, s3Key} = await uploadSlideshowFile({
          slideshowUuid,
          fileExtension,
          file,
          onProgress: (progress) => {
            setUpload({progress})
          },
        })
        update(uuid, (slide) =>
          slide.type === 'website' ? slide : {...slide, url: assetUrl, s3Key}
        )
        setUploads(Record.remove(uuid))
      } catch (error) {
        setUpload({
          error: error instanceof Error ? error.message : 'Upload failed',
        })
      }
    },
    [slideshowUuid, update]
  )

  const addFiles = (files: readonly File[]) => {
    const [rejected, accepted] = pipe(
      files,
      Array.partitionMap((file) =>
        pipe(
          fileExtensionOf(file),
          Either.fromOption(() => file.name),
          Either.map((extension) => ({
            file,
            extension,
            slide: newSlide(mediaTypeOf(extension)),
          }))
        )
      )
    )

    setRejectedFiles(rejected)
    setSlides(Array.appendAll(Array.map(accepted, ({slide}) => slide)))
    Array.forEach(accepted, ({slide, file, extension}) => {
      void upload(slide.uuid, file, extension)
    })
  }

  const replaceFile = (slide: SlideshowSlide, file: File) => {
    const extension = fileExtensionOf(file)
    if (
      Option.isSome(extension) &&
      mediaTypeOf(extension.value) === slide.type
    ) {
      void upload(slide.uuid, file, extension.value)
    } else {
      setUploads(
        Record.set(slide.uuid, {
          error: `${file.name} is not a supported ${slide.type} file`,
        })
      )
    }
  }

  return {
    slides,
    rejectedFiles,
    uploadOf: (uuid: string): UploadState | undefined =>
      pipe(uploads, Record.get(uuid), Option.getOrUndefined),
    uploading: Array.some(slides, (slide) =>
      isUploading(pipe(uploads, Record.get(slide.uuid), Option.getOrUndefined))
    ),
    update,
    addFiles,
    replaceFile,
    addWebsite: () => {
      setSlides(Array.append(newSlide('website')))
    },
    remove: (uuid: string) => {
      setSlides(Array.filter((slide) => slide.uuid !== uuid))
      setUploads(Record.remove(uuid))
    },
    move: (fromIndex: number, toIndex: number) => {
      setSlides((current) =>
        pipe(
          Array.get(current, fromIndex),
          Option.flatMap((slide) =>
            pipe(
              current,
              Array.remove(fromIndex),
              Array.insertAt(toIndex, slide)
            )
          ),
          Option.getOrElse(() => current)
        )
      )
    },
  }
}

export type Slides = ReturnType<typeof useSlides>

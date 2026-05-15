import {Stack, Typography} from '@vexl-next/ui'
import {Directory, Paths} from 'expo-file-system'
import React, {useEffect, useState} from 'react'
import urlJoin from 'url-join'

async function getFileOrDirectory(path: string): Promise<string> {
  try {
    const info = Paths.info(path)
    const isDirectory = info.isDirectory
    let result = `${path} ${isDirectory ? 'D' : 'F'} \n`
    if (isDirectory) {
      const files = new Directory(path).list()
      for (const file of files) {
        result += `${await getFileOrDirectory(`${path}${file.uri}`)}`
      }
      return result
    }
    return result
  } catch (e) {
    return `E ${path}`
  }
}

function FilesInDocuments(): React.ReactElement {
  const [files, setFiles] = useState<string>('initial')

  useEffect(() => {
    void (async () => {
      try {
        const documentDirectory = Paths.document
        if (!documentDirectory) throw new Error('No document directory')
        setFiles(await getFileOrDirectory(urlJoin(documentDirectory.uri)))
      } catch (e) {
        setFiles(`Error reading files ${String(e)}`)
      }
    })()
  }, [setFiles])

  return (
    <Stack>
      <Typography variant="paragraphSmallBold" color="$foregroundPrimary">
        Files in document dir:
      </Typography>
      <Typography variant="description" color="$foregroundPrimary">
        {files}
      </Typography>
    </Stack>
  )
}

export default FilesInDocuments

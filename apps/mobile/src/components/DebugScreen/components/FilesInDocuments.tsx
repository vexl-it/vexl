import {Directory, Paths} from 'expo-file-system'
import React, {useEffect, useState} from 'react'
import {Stack, Text} from 'tamagui'
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
      <Text>Files in document dir:</Text>
      <Text>{files}</Text>
    </Stack>
  )
}

export default FilesInDocuments

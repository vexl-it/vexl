import {
  documentDirectory,
  getInfoAsync,
  readDirectoryAsync,
} from 'expo-file-system'
import {useEffect, useState} from 'react'
import {Stack, Text} from 'tamagui'
import urlJoin from 'url-join'

async function getFileOrDirectory(path: string): Promise<string> {
  try {
    const info = await getInfoAsync(path)
    const isDirectory = info.isDirectory
    let result = `${path} ${isDirectory ? 'D' : 'F'} \n`
    if (info.isDirectory) {
      const files = await readDirectoryAsync(info.uri)
      for (const file of files) {
        result += `${await getFileOrDirectory(`${path}${file}`)}`
      }
      return result
    }
    return result
  } catch (e) {
    return `E ${path}`
  }
}

function FilesInDocuments(): JSX.Element {
  const [files, setFiles] = useState<string>('initial')

  useEffect(() => {
    void (async () => {
      try {
        if (!documentDirectory) throw new Error('No document directory')
        setFiles(await getFileOrDirectory(urlJoin(documentDirectory)))
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

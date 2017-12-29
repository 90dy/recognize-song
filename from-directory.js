import fs from 'fs'
import path from 'path'
import { getAbsoluteFilePath } from './helpers'
import { retrieveAudioFileData } from './recognize-song'

const main = async ({ argv }) => {
  const dirPath = getAbsoluteFilePath(argv[2])
  const dir = fs.readdirSync(dirPath)
  for (let fileBase of dir) {
    const filePath = path.resolve(dirPath, fileBase)
    await retrieveAudioFileData(filePath)
  }
}

export default main(process)

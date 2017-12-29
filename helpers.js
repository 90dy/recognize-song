import AcrCloud from 'acrcloud'
import fs from 'fs'
import path from 'path'
import { exec } from 'child_process'
import { retrieveLargeAudioFileData } from './from-large-file'

export const checkFile = file => {
  if (file == null) {
    throw new Error('Please provide a file to analyze')
  }
  if (fs.existsSync(file) === false) {
    throw new Error('File does not exists')
  }
  return true
}

export const checkType = file => {
  if (['wav', 'mp3', 'au', 'ogg', 'm4a', 'mp4'].some(ext => ext === path.extname(file).substr(1)) === false) {
    throw new Error('The file extension must be wav, mp3, au, ogg, m4a or mp4')
  }
  return true
}

export const getAbsoluteFilePath = relativePath => checkFile(relativePath) && path.resolve(__dirname, relativePath)

export const getFileType = filePath => checkType(filePath) && path.extname(filePath).substr(1)

export const trimSong = (file, { start, duration } = { start: '30', duration: '30' }) => {
  const tmpFilePath = path.resolve(__dirname, `tmp_trimed_song.${file.type}`)
  return new Promise((resolve, reject) =>
    exec(`ffmpeg -i "${file.path}" -ss ${start} -t ${duration} -c copy "${tmpFilePath}" -y`, error => (error ? reject(error) : resolve(tmpFilePath)))
  )
}

export const getAudioMetadata = async data => {
  const acr = new AcrCloud({
    host: 'identify-eu-west-1.acrcloud.com',
    access_key: 'ffa56467940f73d4b9a6984b0c07e067',
    access_secret: 'kfAfWo6AtkgrGh5UooQajVNZ6aiktdFAwnakN21f'
  })

  const { metadata } = await acr.identify(data)

  if (metadata == null) {
    throw new Error('Unknown song')
  }
  const [music] = metadata.music

  return music
}

export const fetchAudioFileMetadata = async ({ path, type }, trim) => {
  const trimedFile = await trimSong({ path, type }, trim)
  const trimedData = await fs.readFileSync(trimedFile)
  return getAudioMetadata(trimedData)
}

export const getAudioFileLength = async filePath =>
  new Promise((resolve, reject) =>
    exec(
      `ffprobe -v 0 -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
      (err, res) => (err ? reject(err) : resolve(Number(res)))
    )
  )

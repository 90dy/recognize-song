import path from 'path'
import fs from 'fs'
import { getAbsoluteFilePath as getAbsFilePath, getFileType, getAudioFileLength, fetchAudioFileMetadata } from './helpers'
import { exec } from 'child_process'

export const writeLargeAudioFileMetadata = ({ file, metadata: { title, artists, album, release_date } }) =>
  new Promise((resolve, reject) => {
    switch (file.type) {
      case 'mp3':
      case 'mp4':
      case 'm4a': {
        const metadata = {
          artist: artists.map(a => a.name).join('/'),
          title,
          album: album.name,
          album_artist: artists.map(a => a.name).join('/'),
          date: release_date
        }
        const tmpFile = `tmp_write_song.${file.type}`
        exec(
          `ffmpeg -i "tmp_trimed_song.${file.type}" -c copy ${Object.keys(metadata)
            .map(key => `-metadata ${key}="${metadata[key]}"`)
            .join(' ')} "${tmpFile}" -y`,
          error => {
            if (error) {
              reject(error)
            } else {
              const newFileArtists = artists.reduce((a, { name }, i) => {
                switch (i) {
                  case 0:
                    return name
                  case artists.length - 1:
                    return `${a} & ${name}`
                  default:
                    return `${a}, ${name}`
                }
              }, '')
              const newFileBase = `${newFileArtists} - ${title}.${file.type}`
                .replace(/\\/g, '-')
                .replace(/\//g, '-')
                .replace(/\?/g, '')
              const newFilePath = path.resolve(path.parse(file.path).dir, newFileBase)
              fs.createReadStream(tmpFile).pipe(fs.createWriteStream(newFilePath))
              resolve(newFilePath)
            }
          }
        )
        break
      }
      default:
        reject(new Error(`${file.type} not supported`))
        break
    }
  })

export const retrieveLargeAudioFileData = async filePath => {
  console.log(`${path.parse(filePath).base}:`)
  const file = {
    path: getAbsFilePath(filePath),
    type: getFileType(filePath)
  }
  console.log('Get audio file length ...')
  let minutesLength = (await getAudioFileLength(file.path)) / 60
  for (let i = 0; i < minutesLength; ++i) {
    try {
      console.log(`${i * 60}:`)
      console.log('Fetch audio file metadata ...')
      const metadata = await fetchAudioFileMetadata(file, { start: i * 60, duration: 30 })
      console.log('Write audio file metadata ...')
      const newPath = await writeLargeAudioFileMetadata({ file, metadata })
      console.log(`${path.parse(newPath).base} created`)
      console.log('')
    } catch (e) {
      console.error(`${path.parse(filePath).base}: ${e}`)
      console.error('')
    }
  }
}

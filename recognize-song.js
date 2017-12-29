import path from 'path'
import fs from 'fs'
import { getAbsoluteFilePath, getFileType, getAudioFileLength, fetchAudioFileMetadata } from './helpers'
import { exec } from 'child_process'
import { retrieveLargeAudioFileData } from './from-large-file'

export const writeAudioFileMetadata = ({ file, metadata: { title, artists, album, release_date } }) =>
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
          `ffmpeg -i "${file.path}" -c copy ${Object.keys(metadata)
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

export const retrieveAudioFileData = async filePath => {
  try {
    console.log(`${path.parse(filePath).base}:`)
    const file = {
      path: getAbsoluteFilePath(filePath),
      type: getFileType(filePath)
    }
    console.log('Get audio file length ...')
    if ((await getAudioFileLength(file.path)) > 60 * 10) {
      return retrieveLargeAudioFileData(filePath)
    }
    console.log('Fetch audio file metadata ...')
    const metadata = await fetchAudioFileMetadata(file)
    console.log('Write audio file metadata ...')
    const newPath = await writeAudioFileMetadata({ file, metadata })
    if (file.path !== newPath) {
      fs.unlinkSync(file.path)
    }
    console.log(`${path.parse(newPath).base} created`)
    console.log('')
    return newPath
  } catch (e) {
    console.error(`Error: ${path.parse(filePath).base}: ${e.message}`)
    console.error('')
  }
}

export default retrieveAudioFileData

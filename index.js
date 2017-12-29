import { retrieveAudioFileData } from './recognize-song'

const main = async ({ argv }) => {
  await retrieveAudioFileData(argv[2])
}

export default main(process)

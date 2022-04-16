import { registerFont } from 'canvas'
import ffmpeg from 'fluent-ffmpeg'
import * as fs from 'fs'

import {
    copyAudioFromV1ToV2,
    extractFramesFromVideo,
    generateVideoFromFrames,
    getVideoInfo,
    renderLetterFrameForEachFrame,
} from 'helpers/vidConverter'

const vidPath = './public/assets/vid.mp4',
    // will be emptied before each extraction
    outputPath = './public/assets/extracted',
    ffmpegCommands: Array<ReturnType<typeof ffmpeg>> = [],
    groupBy = 10,
    greenMode = true

const main = async () => {
    const { frameRate, width, height, duration } = await getVideoInfo(vidPath)

    registerFont('./public/assets/matrix.ttf', { family: 'Matrix' })

    console.log(
        `\n\n\nDuration of video: ${duration}s\n\nFPS: ${frameRate}\n\nSize: ${width}px x ${height}px\n\n\n`
    )

    console.log('\n\n\nDeleting outputs folder content..\n\n\n')

    // delete fodlder
    fs.rmSync(outputPath, { recursive: true })

    // make folder
    fs.mkdirSync(outputPath)

    console.log('\n\n\nExtracting video frames..\n\n\n')

    await extractFramesFromVideo({
        vidPath,
        outputPath,
    })

    // get list of created files
    const files = fs.readdirSync(outputPath).filter((name) => name.includes('.jpg'))

    await renderLetterFrameForEachFrame({
        files,
        width,
        height,
        groupBy,
        outputPath,
        greenMode,
        onSaveBufferToFile: (fileName, buffer) =>
            fs.writeFileSync(`${outputPath}/${fileName.replace('jpg', 'png')}`, buffer),
    })

    await console.log('\n\n\nGenerating output video...\n\n\n')

    await generateVideoFromFrames({
        outputPath,
        frameRate: frameRate || 29,
        fileCount: files.length,
    })

    // copy audio from original and put in source without re-encoding (no quality loss)
    await copyAudioFromV1ToV2({
        vidPath,
        outputPath,
    })

    console.log('\n\n\nOutput is ready!\n\n\n')
    console.log('\n\n\nDeleting files...\n\n\n')
    fs.rmdirSync(outputPath, { recursive: true })
    fs.mkdirSync(outputPath)
    console.log('\n\n\nDone!!!\n\n\n')
}

main()

process.on('exit', () => {
    console.log('Exiting, killing ffmpeg commands')

    ffmpegCommands.forEach((c) => c.kill('SIGKILL'))
})

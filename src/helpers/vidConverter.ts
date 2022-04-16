import { createCanvas, loadImage } from 'canvas'
import ffmpeg from 'fluent-ffmpeg'

import { renderLetteredFrame } from './helpers'

const ffmpegCommands: Array<ReturnType<typeof ffmpeg>> = []

export const extractFramesFromVideo = ({
    vidPath,
    outputPath,
}: {
    vidPath: string
    outputPath: string
}) =>
    new Promise((res, rej) => {
        const command = ffmpeg().addInput(vidPath).addOutput(`${outputPath}/frame-%05d.jpg`)

        ffmpegCommands.push(command)

        command
            .on('end', () => res('Done baby!'))
            .on('error', (err) => rej(err))
            .run()
    })

export const generateVideoFromFrames = ({
    frameRate,
    outputPath,
    fileCount,
}: {
    frameRate: number
    outputPath: string
    fileCount: number
}) =>
    new Promise((res, rej) => {
        const command = ffmpeg()
            .addInput(`${outputPath}/frame-%05d.png`)
            .addInputOption(`-r ${frameRate}`)
            .withVideoCodec('libx264')
            .withOutputOptions([`-vframes ${fileCount}`, '-crf 25'])
            .addOutput(`${outputPath}/tmp.mp4`)

        ffmpegCommands.push(command)

        command
            .on('end', () => res('Done baby!'))
            .on('error', (err) => rej(err))
            .run()
    })

export const copyAudioFromV1ToV2 = ({
    outputPath,
    vidPath,
}: {
    vidPath: string
    outputPath: string
}) =>
    new Promise((res, rej) => {
        const command = ffmpeg()
            .addInput(`${outputPath}/tmp.mp4`)
            .addInput(vidPath)
            .addOutput(vidPath.replace('vid', 'output'))
            .addOutputOptions(['-c copy', '-map 0:0', '-map 1:1', '-shortest'])

        ffmpegCommands.push(command)

        command
            .on('end', () => res('Done baby!'))
            .on('error', (err) => rej(err))
            .run()
    })

export const getVideoInfo = (vidPath: string) =>
    new Promise<{
        frameRate: number
        width: number
        height: number
        duration: number
    }>((res, rej) => {
        ffmpeg.ffprobe(vidPath, async (err, metadata) => {
            if (err) {
                console.log('There was an issue', err)
                return rej(err)
            }

            const frameRate = metadata.streams[0]
                    .avg_frame_rate!.split('/')
                    .reduce((acc, n) => (acc ? acc / +n : +n), 0),
                { width, height, duration } = metadata.streams[0]

            if (!width || !height || !frameRate || !duration) {
                console.error('Issue with getting vid info..')
                return rej('Issue with getting vid info..')
            }
            res({
                duration: +duration,
                frameRate,
                width,
                height,
            })
        })
    })

export const renderLetterFrameForEachFrame = ({
    files,
    width,
    height,
    outputPath,
    groupBy,
    onSaveBufferToFile,
    greenMode = false,
}: {
    files: string[]
    width: number
    height: number
    outputPath: string
    groupBy: number
    onSaveBufferToFile: (fileName: string, buffer: Buffer) => void
    greenMode?: boolean
}) =>
    new Promise<void>((res, rej) => {
        const canvas = createCanvas(width, height),
            ctx = canvas.getContext('2d'),
            operations = files.map((fileName) => async () => {
                const image = await loadImage(`${outputPath}/${fileName}`)

                renderLetteredFrame({
                    groupBy,
                    image: image as unknown as CanvasImageSource,
                    ctx: ctx as unknown as CanvasRenderingContext2D,
                    withBackgroundColor: 'black',
                    greenMode,
                })

                // save frame
                const buffer = canvas.toBuffer('image/png')

                // save to where ffmpeg will then find and use for adding back together
                onSaveBufferToFile(fileName, buffer)
            }),
            executor = async () => {
                try {
                    for (let loaded = 0; loaded < operations.length; loaded++)
                        await operations[loaded]()
                    res()
                } catch (err) {
                    rej(err)
                }
            }

        executor()
    })

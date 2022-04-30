import { getPixels, savePixels } from 'ndarray-pixels'
import { Resolution, VidConfig } from 'types/common'

import { createFFmpeg } from '@ffmpeg/ffmpeg'

import { drawImageFittingWithinParentBounds } from './canvas'
import { GlobalMessenger } from './globalMessenger'
import { runAlgorithm } from './helpers'

const worker = createFFmpeg({
    logger: (msg) => console.log(msg),
    progress: (p) => console.log('p', p),
    corePath: '/dist/ffmpeg-core/ffmpeg-core.js',
})

const readFile = (file: File) =>
    new Promise<Uint8Array>((res, rej) => {
        const fileReader = new FileReader()

        fileReader.onload = () => {
            const arrayBuffer = new Uint8Array(fileReader.result as ArrayBuffer)
            res(arrayBuffer)
        }

        fileReader.onerror = rej

        fileReader.readAsArrayBuffer(file)
    })

const downloadBlob = ({ fileName, url }: { fileName: string; url: string }) => {
    const a = document.createElement('a')
    a.setAttribute('download', fileName)
    a.setAttribute('href', url)
    a.click()
    a.remove()
}

const renderLetterFrameForEachImageBuffer = ({
    files,
    groupBy,
    greenMode = false,
    textMode = false,
}: {
    files: ImgAsArrayBufferWithInfo[]
    width: number
    height: number
    groupBy: number
    greenMode?: boolean
    textMode?: boolean
}) =>
    new Promise<ImgAsArrayBufferWithInfo[]>((res, rej) => {
        const formattedFramesBuffer: ImgAsArrayBufferWithInfo[] = [],
            // hidden canvas to format frames on
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d')

        if (!ctx) throw Error('There was an issue setting context for canvas')

        const operations = files.map(({ fileName, fileContents, fileSize }) => async () => {
                canvas.width = fileSize.width
                canvas.height = fileSize.height

                const ui8ca = new Uint8ClampedArray(fileContents),
                    image = new ImageData(ui8ca, fileSize.width, fileSize.height)

                runAlgorithm({
                    imageData: image,
                    ctx,
                    groupBy,
                    greenMode,
                    withTextInsteadOfChars: textMode,
                })

                // save formatted frame
                const imageUrl = ctx.canvas.toDataURL('image/jpg'),
                    imageData = await getPixels(imageUrl, 'image/jpg'),
                    imageDataAsUInt8Array = await savePixels(imageData, 'image/jpg')

                // save to where ffmpeg will then find and use for adding back together
                formattedFramesBuffer.push({
                    fileSize,
                    fileName: `formatted-${fileName}`,
                    fileContents: imageDataAsUInt8Array,
                })

                drawImageFittingWithinParentBounds({
                    fileSize,
                    imageData: ctx.canvas,
                    parentSize: {
                        width: window.innerWidth,
                        height: window.innerHeight,
                    },
                    ctx: GlobalMessenger.ctx!,
                })
            }),
            executor = async () => {
                try {
                    for (let loaded = 0; loaded < operations.length; loaded++)
                        await operations[loaded]()
                    res(formattedFramesBuffer)
                } catch (err) {
                    rej(err)
                }
            }

        executor()
    })

const mapFileTypeToProperExtension = Object.create(null, {
    quicktime: {
        value: 'mov',
    },
})

const copyInputFilesIntoMEMFS = (
    files: File[],
    fileNameToMEMFSFileName: Map<string, { inputName: string; type: string }>
) =>
    new Promise((res, rej) => {
        let c = 0

        try {
            files.forEach(async (file, idx) => {
                const extractedType = file.type.split('/')[1],
                    type = mapFileTypeToProperExtension[extractedType] || extractedType,
                    fileArrayBuffer = await readFile(file),
                    inputName = `input-${idx}.${type}`

                fileNameToMEMFSFileName.set(file.name, { inputName, type })

                // Write file data to MEMFS
                worker.FS('writeFile', inputName, fileArrayBuffer)

                console.log(`${file.name} written to MMFS as ${inputName}`)

                if (c + 1 === files.length) res('Done')
                else c += 1
            })
        } catch (e) {
            rej(e)
        }
    })

type ImgAsArrayBufferWithInfo = {
    fileName: string
    fileSize: {
        width: number
        height: number
    }
    fileContents: Uint8Array
}

const getFramesAsBufferArr = async (inputName: string): Promise<ImgAsArrayBufferWithInfo[]> => {
    const arr: ImgAsArrayBufferWithInfo[] = []

    // ffmped wasm FS does not allow to get all files in MEMFS so start getting sequentially all frames
    for (let frame = 1; frame < 999999; frame++) {
        const frameCount = ('000000' + frame.toString()).slice(-6),
            fileName = `frame-${inputName.split('.')[0]}-${frameCount}.jpg`,
            img = await getImageAsBuffer(fileName, 'No more frames to read from MEMFS')

        if (img) arr.push(img)
        else break
    }

    return arr
}

const getImageAsBuffer = async (
    fileName: string,
    endMsg = 'No such file in MEMFS'
): Promise<ImgAsArrayBufferWithInfo | null> => {
    try {
        const frameFile = worker.FS('readFile', fileName),
            imageData = await getPixels(frameFile, 'image/jpg'),
            [width, height] = imageData.shape

        // imageData.shape has the size of frame
        return {
            fileName,
            fileContents: imageData.data as Uint8Array,
            fileSize: { width, height },
        }
    } catch (err) {
        console.log(endMsg, err)
        return null
    }
}

const writeFormattedFileToMEMFS = (files: ImgAsArrayBufferWithInfo[]) => {
    files.forEach(({ fileName, fileContents }) => worker.FS('writeFile', fileName, fileContents))
}

const processInput = async (
    config: VidConfig,
    { inputName, type }: FileInfo,
    fileName: string,
    setPreviewCanvasSize: (size: Resolution | 'default') => void
) => {
    const extension = inputName.split('.')[1]

    let url = '',
        size = { width: 0, height: 0 }

    if (['mp4', 'mov'].includes(extension)) {
        // vid to frmaes
        await worker.run('-i', inputName, `frame-${inputName.split('.')[0]}-%06d.jpg`)

        console.log('Getting frames from MEMFS as Buffer')

        const framesBufferArr = await getFramesAsBufferArr(inputName)

        size = framesBufferArr[0].fileSize

        // first frame img size should be same as all other frame imgs
        setPreviewCanvasSize(size)

        console.log('Formatting frames')

        const formattedFramesBufferArr = await renderLetterFrameForEachImageBuffer({
                ...config,
                files: framesBufferArr,
            }),
            framesCount = formattedFramesBufferArr.length

        console.log('Starting to write formatted framtes to MEMFS..')

        writeFormattedFileToMEMFS(formattedFramesBufferArr)

        console.log('Finsihed writing formatted frames to MEMFS')

        console.log('Rendering video..')

        await worker.run(
            '-i',
            `formatted-frame-${inputName.split('.')[0]}-%06d.jpg`,
            '-r',
            '29',
            '-c',
            'libx264',
            '-vframes',
            `${framesCount}`,
            '-crf',
            '25',
            `tmp-output-${fileName}`
        )

        console.log('Adding audio track from original source')

        // mux audio from v1 to v2
        await worker.run(
            '-i',
            // take output without audio
            `tmp-output-${fileName}`,
            '-i',
            // original video
            inputName,
            '-c',
            'copy',
            '-map',
            '0:0',
            '-map',
            '1:1?',
            '-shortest',
            `output-${fileName}`
        )

        console.log('Rendered video into MEMFS')

        // read output
        const fileArrayBuffer = worker.FS('readFile', `output-${fileName}`)

        // eslint-disable-next-line
        url = window.URL.createObjectURL(new Blob([fileArrayBuffer], { type }))
    } else if (['jpg', 'png', 'jpeg'].includes(extension)) {
        console.log('Getting image from MEMFS as Buffer')

        const imgBuffer = await getImageAsBuffer(inputName)

        // should never run
        if (!imgBuffer) return console.log('Issue getting file from MEMFS')

        size = imgBuffer.fileSize

        // first frame img size should be same as all other frame imgs
        setPreviewCanvasSize(size)

        console.log('Formatting image', imgBuffer)

        const [{ fileContents }] = await renderLetterFrameForEachImageBuffer({
            ...config,
            files: [imgBuffer],
        })

        // eslint-disable-next-line
        url = window.URL.createObjectURL(new Blob([fileContents], { type }))
    }

    downloadBlob({ url, fileName })

    // clear preview
    GlobalMessenger.ctx?.clearRect(0, 0, size.width, size.height)
    setPreviewCanvasSize('default')
}

type FileInfo = { inputName: string; type: string }

export const processFilesWithConfig = async (
    config: VidConfig,
    setPreviewCanvasSize: (size: Resolution | 'default') => void
) => {
    if (!worker.isLoaded()) await worker.load()

    GlobalMessenger.preview.stopLiveRendering!()

    const fileNameToMEMFSFileName = new Map<string, FileInfo>()

    console.log('Writing input files to MEMFS')

    await copyInputFilesIntoMEMFS(config.files, fileNameToMEMFSFileName)

    console.log('Finished writing input files to MEMFS')

    // process inputs
    for (const [fileName, fileInfo] of fileNameToMEMFSFileName)
        await processInput(config, fileInfo, fileName, setPreviewCanvasSize)

    GlobalMessenger.preview.startLiveRendering!()
}

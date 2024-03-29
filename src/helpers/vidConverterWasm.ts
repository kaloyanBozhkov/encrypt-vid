import { getPixels, savePixels } from 'ndarray-pixels'

import type { PreviewSettings } from 'context/previewSettings/previewSettings.contex'
import type { RenderSettings } from 'context/renderSettings/renderSettings.contex'

import { createFFmpeg } from '@ffmpeg/ffmpeg'

import type { Resolution } from 'types/common'

import { drawImageFittingWithinParentBounds } from './canvas'
import { downloadFile, runAlgorithm } from './helpers'

const worker = createFFmpeg({
    logger: (msg) => console.log(msg),
    progress: (p) => console.log('p', p),
    corePath: '/dist/ffmpeg-core/ffmpeg-core.js',
})

// store names of file sused for temporary processing
let filesToClean: string[] = []

const cleanWorkingFiles = () => {
    filesToClean.forEach((fileName) => worker.FS('unlink', `./${fileName}`))
    filesToClean = []
}

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

const renderLetterFrameForEachImageBuffer = ({
    files,
    renderSettings,
    previewSettings,
}: {
    files: ImgAsArrayBufferWithInfo[]
    renderSettings: RenderSettings
    previewSettings: PreviewSettings
}) =>
    new Promise<ImgAsArrayBufferWithInfo[]>((res, rej) => {
        const formattedFramesBuffer: ImgAsArrayBufferWithInfo[] = [],
            // hidden canvas to format frames on
            canvas = document.createElement('canvas'),
            ctx = canvas.getContext('2d')

        if (!ctx) throw Error('There was an issue setting context for canvas')

        const operations = files.map(({ fileName, fileContents, fileSize }) => async () => {
                if (canvas.width !== fileSize.width || canvas.height !== fileSize.height) {
                    canvas.width = fileSize.width
                    canvas.height = fileSize.height
                }

                const ui8ca = new Uint8ClampedArray(fileContents),
                    image = new ImageData(ui8ca, fileSize.width, fileSize.height)

                runAlgorithm({
                    renderSettings,
                    previewSettings: {
                        ...previewSettings,
                        // use the converter ctx instead of the preview one
                        ctx,
                    },
                    imageData: image,
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

                // preview the formatted frame
                drawImageFittingWithinParentBounds({
                    fileSize,
                    imageData: ctx.canvas,
                    parentSize: {
                        width: document.documentElement.clientWidth,
                        height: document.documentElement.clientHeight,
                    },
                    ctx: previewSettings.ctx!,
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
    fileSize: Resolution
    fileContents: Uint8Array
}

const getFramesAsBufferArr = async (inputName: string): Promise<ImgAsArrayBufferWithInfo[]> => {
    const arr: ImgAsArrayBufferWithInfo[] = []

    // ffmped wasm FS does not allow to get all files in MEMFS so start getting sequentially all frames
    for (let frame = 1; frame < 999999; frame++) {
        const frameCount = ('000000' + frame.toString()).slice(-6),
            fileName = `frame-${inputName.split('.')[0]}-${frameCount}.jpg`,
            img = await getImageAsBuffer(fileName, 'No more frames to read from MEMFS')

        if (img) {
            arr.push(img)
            filesToClean.push(fileName)
        } else break
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
    files.forEach(({ fileName, fileContents }) => {
        worker.FS('writeFile', fileName, fileContents)
        filesToClean.push(fileName)
    })
}

const processInput = async ({
    /* inputNmae: name of file on MEMFS */
    fileInfo: { inputName, type },
    /* name of file on PC */
    fileName,
    setProcessingMsg,
    renderSettings,
    previewSettings,
}: {
    fileInfo: FileInfo
    fileName: string
    setProcessingMsg: (msg: string) => void
    renderSettings: RenderSettings
    previewSettings: PreviewSettings
}) => {
    const extension = inputName.split('.')[1]

    let url = '',
        outputFileName = ''

    if (['mp4', 'mov'].includes(extension)) {
        setProcessingMsg(`Extracting frames from "${fileName}"`)

        // vid to frmaes
        await worker.run('-i', inputName, `frame-${inputName.split('.')[0]}-%06d.jpg`)

        console.log('Getting frames from MEMFS as Buffer')

        const framesBufferArr = await getFramesAsBufferArr(inputName)

        setProcessingMsg(`Formatting frames for "${fileName}"`)
        console.log('Formatting frames')

        const formattedFramesBufferArr = await renderLetterFrameForEachImageBuffer({
                files: framesBufferArr,
                previewSettings,
                renderSettings,
            }),
            framesCount = formattedFramesBufferArr.length

        console.log('Starting to write formatted framtes to MEMFS..')

        writeFormattedFileToMEMFS(formattedFramesBufferArr)

        console.log('Finsihed writing formatted frames to MEMFS')

        setProcessingMsg(`Rendering output for "${fileName}"`)

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

        outputFileName = `output-${fileName}`

        // read output
        const fileArrayBuffer = worker.FS('readFile', outputFileName)

        // eslint-disable-next-line
        url = window.URL.createObjectURL(new Blob([fileArrayBuffer], { type }))
    } else if (['jpg', 'png', 'jpeg'].includes(extension)) {
        setProcessingMsg(`Importing "${fileName}"`)

        console.log('Getting image from MEMFS as Buffer')

        const imgBuffer = await getImageAsBuffer(inputName)

        // should never run
        if (!imgBuffer) return console.log('Issue getting file from MEMFS')

        setProcessingMsg(`Formatting "${fileName}"`)
        console.log('Formatting image', imgBuffer)

        const [{ fileContents }] = await renderLetterFrameForEachImageBuffer({
            renderSettings,
            previewSettings,
            files: [imgBuffer],
        })

        // eslint-disable-next-line
        url = window.URL.createObjectURL(new Blob([fileContents], { type }))

        setProcessingMsg('Preview time!')

        // let the preview show for a little
        await new Promise((res) => setTimeout(res, 2000))
    }

    setProcessingMsg(`Saving output from "${fileName}"`)

    downloadFile({ url, fileName })
    if (outputFileName) filesToClean.push(outputFileName)

    // eslint-disable-next-line
    window.URL.revokeObjectURL(url)

    // clear render preview
    previewSettings.ctx!.clearRect(
        0,
        0,
        previewSettings.ctx!.canvas.width,
        previewSettings.ctx!.canvas.height
    )
}

type FileInfo = { inputName: string; type: string }

export const processFilesWithConfig = async ({
    files,
    setProcessingMsg,
    renderSettings,
    previewSettings,
}: {
    files: File[]
    setProcessingMsg: (msg: string) => void
    renderSettings: RenderSettings
    previewSettings: PreviewSettings
}) => {
    setProcessingMsg('Loading worker')

    if (!worker.isLoaded()) await worker.load()

    setProcessingMsg('Copying input files')

    const fileNameToMEMFSFileName = new Map<string, FileInfo>()

    console.log('Writing input files to MEMFS')

    await copyInputFilesIntoMEMFS(files, fileNameToMEMFSFileName)

    console.log('Finished writing input files to MEMFS')

    // process inputs
    for (const [fileName, fileInfo] of fileNameToMEMFSFileName)
        await processInput({
            fileInfo,
            fileName,
            setProcessingMsg,
            renderSettings,
            previewSettings,
        })

    setProcessingMsg('Cleaning temporary files')
    cleanWorkingFiles()
}

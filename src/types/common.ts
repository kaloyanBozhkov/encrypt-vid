export type WebPreviewConfig = {
    groupBy: number
    withJustGreen: boolean
    width: number
    height: number
} & (
    | {
          withTextInsteadOfChars: false
          withSpeechUpdatedText?: boolean
      }
    | {
          withTextInsteadOfChars: true
          withSpeechUpdatedText: boolean
      }
)

export type VidConfig = {
    width: number
    height: number
    groupBy: number
    greenMode: boolean
    textMode: boolean
    speechMode: boolean
    files: File[]
}

export type Resolution = { width: number; height: number }

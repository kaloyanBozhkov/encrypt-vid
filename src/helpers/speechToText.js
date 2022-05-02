const globalMessengerModules = require('./globalMessenger.ts')

let isOn = false

const speechToText = () => {
    if (!isOn) {
        let final_transcript = ''

        isOn = true

        const recognition = new window.webkitSpeechRecognition()

        recognition.continuous = true
        recognition.interimResults = true

        recognition.onspeechstart = (event) => {
            console.log('start speech', event)
        }

        recognition.onspeechend = (event) => {
            console.log('end speech', event)
            console.log('final_transcript', final_transcript)
        }

        recognition.onresult = (event) => {
            for (let i = event.resultIndex; i < event.results.length; ++i)
                if (event.results[i].isFinal) final_transcript += event.results[i][0].transcript

            if (final_transcript)
                globalMessengerModules.globalMessenger.renderSettings.charsObj.speech =
                    final_transcript.replaceAll(/[ ]/g, '±').toUpperCase()

            console.log(globalMessengerModules.globalMessenger.renderSettings.charsObj.speech)
        }

        recognition.onerror = (event) => {
            console.log('error', event)
        }

        recognition.onend = (event) => {
            console.log('ended', event)
        }

        recognition.lang = 'en'

        recognition.start()

        return () => {
            isOn = false
            recognition.stop()
        }
    }
}

module.exports = {
    speechToText,
}

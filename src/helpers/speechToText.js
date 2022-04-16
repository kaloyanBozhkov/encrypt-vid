const helpers = require('./helpers.ts')

const speechToText = () => {
    let final_transcript = ''

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
            helpers.charsObj.text = final_transcript.replaceAll(/[ ]/g, '±').toUpperCase()

        console.log(helpers.charsObj.text)
    }

    recognition.onerror = (event) => {
        console.log('error', event)
    }

    recognition.onend = (event) => {
        console.log('ended', event)
    }

    recognition.lang = 'en'

    recognition.start()
}

module.exports = {
    speechToText,
}

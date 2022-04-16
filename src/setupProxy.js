// the ffmpeg-core script is loaded by ffmpeg, this is done with a network request T_T gotta make sure it loads it properly
module.exports = (app) => {
    app.use((request, response, next) => {
        response.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
        response.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
        next()
    })
}

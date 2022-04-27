import React from 'react'

import ReactDOMClient from 'react-dom/client'

import App from './App'
import './index.css'
import reportWebVitals from './reportWebVitals'

const container = document.querySelector('#root')

if (!container) throw Error('No root container?!')

const root = ReactDOMClient.createRoot(container)

root.render(
    // <React.StrictMode>
    <App />
    // </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()

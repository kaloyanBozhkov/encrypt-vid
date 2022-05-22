import React from 'react'

import ReactDOMClient from 'react-dom/client'

import App from './App'
import './index.css'

const container = document.querySelector('#root')

if (!container) throw Error('No root container?!')

const root = ReactDOMClient.createRoot(container)

root.render(<App />)

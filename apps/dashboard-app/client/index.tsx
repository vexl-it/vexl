import dayjs from 'dayjs'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './components/App'
import './index.css'

dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)

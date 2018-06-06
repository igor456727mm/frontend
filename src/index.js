import React from 'react'
import ReactDOM from 'react-dom'
import { Provider } from 'react-redux'
import App from './App'
import { version } from '../package.json'
import { unregister } from './registerServiceWorker'

import store from './reducers'
//const store = window.store = createStore(reducers, {})

console.log(`v: ${version}`)
unregister()

window.app = ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>
, document.getElementById('root'))

import React from 'react'
import {Provider} from 'react-redux'
import {lifecycle} from 'recompose'
import {injectGlobal} from 'emotion'

import Routes from './Routes'

import createStore from '../ducks'

const store = createStore()

const App = () => (
  <Provider store={store}>
    <Routes />
  </Provider>
)

const enhance = lifecycle({
  componentWillMount() {
    injectGlobal`
      body {
        margin: 0;
        color: #555;
        min-height: 100vh;
        font-weight: 300;
        font-family: Roboto, "Helvetica Neue", "Sukhumvit Set", Kanit, Avenir, -apple-system, BlinkMacSystemFont, "Segoe UI", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", sans-serif;

        background-image: linear-gradient(#6973ad, #6bc9e9);
      }

      * {
        box-sizing: border-box;
      }

      .ant-select.ant-select-enabled {
        width: 100%;
        min-width: unset !important;
      }

      .DayPickerInput {
        width: 100%;
      }

      .DayPickerInput-OverlayWrapper {
        z-index: 2;
      }

      .ant-confirm-body .ant-confirm-content {
        margin-top: 0 !important;
      }
    `
  },
})

export default enhance(App)

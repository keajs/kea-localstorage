/* global test, expect, beforeEach */
import { kea, resetKeaCache, getStore } from '../../vendor/kea.js'
import storagePlguin from '../index' // install the plugin

import './helper/jsdom'
import React from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

beforeEach(() => {
  resetKeaCache()
})

test('the can save to storage', () => {
  const storageEngine = {}

  let store = getStore({
    plugins: [storagePlguin(storageEngine)]
  })

  let logicWithStorage = kea({
    path: () => ['scenes', 'persist', 'index'],
    actions: () => ({
      setNumber: number => ({ number })
    }),
    reducers: ({ actions }) => ({
      number: [12, PropTypes.number, { persist: true }, {
        [actions.setNumber]: (_, payload) => payload.number
      }]
    })
  })

  expect(logicWithStorage.storageEngine).toBeDefined()
  expect(logicWithStorage.storageEngine).toBe(storageEngine)
  expect(storageEngine.number).not.toBeDefined()

  expect(logicWithStorage.plugins.map(p => p.name)).toEqual(['localStorage'])

  let SampleComponent = ({ number }) => <div className='number'>{number}</div>
  let ConnectedComponent = logicWithStorage(SampleComponent)

  let wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )

  expect(wrapper.find('.number').text()).toEqual('12')

  store.dispatch(logicWithStorage.actions.setNumber(42))

  expect(wrapper.find('.number').text()).toEqual('42')

  wrapper.unmount()

  resetKeaCache()

  // do it all again

  store = getStore({
    plugins: [storagePlguin(storageEngine)]
  })

  logicWithStorage = kea({
    path: () => ['scenes', 'persist', 'index'],
    actions: () => ({
      setNumber: number => ({ number })
    }),
    reducers: ({ actions }) => ({
      number: [12, PropTypes.number, { persist: true }, {
        [actions.setNumber]: (_, payload) => payload.number
      }]
    })
  })

  expect(logicWithStorage.storageEngine).toBeDefined()
  expect(logicWithStorage.storageEngine).toBe(storageEngine)
  expect(storageEngine.number).not.toBeDefined()

  expect(logicWithStorage.plugins.map(p => p.name)).toEqual(['localStorage'])

  SampleComponent = ({ number }) => <div className='number'>{number}</div>
  ConnectedComponent = logicWithStorage(SampleComponent)

  wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )

  expect(wrapper.find('.number').text()).toEqual('42') // even if value says 12 in the logic store

  wrapper.unmount()
})

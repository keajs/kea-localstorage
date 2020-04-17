/* global test, expect */
import { kea, resetContext, getContext, getPluginContext } from 'kea'
import storagePlugin from '../index' // install the plugin

import './helper/jsdom'
import React from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import { Provider } from 'react-redux'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

test('can save to storage', () => {
  const storageEngine = {}
  resetContext({
    createStore: true,
    plugins: [ storagePlugin({ storageEngine }) ]
  })

  let store = getContext().store

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

  expect(getPluginContext('localStorage').storageEngine).toBeDefined()
  expect(getPluginContext('localStorage').storageEngine).toBe(storageEngine)
  expect(storageEngine['scenes.persist.index.number']).not.toBeDefined()

  expect(getContext().plugins.activated.map(p => p.name)).toEqual(['core', 'localStorage'])

  let SampleComponent = ({ number }) => <div className='number'>{number}</div>
  let ConnectedComponent = logicWithStorage(SampleComponent)

  let wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )

  expect(logicWithStorage.cache.localStorageDefaults.number).toBe(12)

  expect(wrapper.find('.number').text()).toEqual('12')

  logicWithStorage.actions.setNumber(42)

  expect(wrapper.find('.number').text()).toEqual('42')

  wrapper.unmount()

  // do it all again

  resetContext({
    createStore: true,
    plugins: [ storagePlugin({ storageEngine }) ]
  })
  store = getContext().store

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

  expect(getPluginContext('localStorage').storageEngine).toBeDefined()
  expect(getPluginContext('localStorage').storageEngine).toBe(storageEngine)
  expect(storageEngine['scenes.persist.index.number']).toBeDefined()

  expect(getContext().plugins.activated.map(p => p.name)).toEqual(['core', 'localStorage'])

  SampleComponent = ({ number }) => <div className='number'>{number}</div>
  ConnectedComponent = logicWithStorage(SampleComponent)

  wrapper = mount(
    <Provider store={store}>
      <ConnectedComponent />
    </Provider>
  )
  expect(logicWithStorage.cache.localStorageDefaults.number).toBe(12)

  expect(wrapper.find('.number').text()).toEqual('42') // even if value says 12 in the logic store

  wrapper.unmount()
})

test('prefix and separator work', () => {
  const storageEngine = {
    setItem (key, value) {
      this[key] = value
    },
    removeItem (key) {
      delete this[key]
    }
  }
  resetContext({
    createStore: true,
    plugins: [ storagePlugin({ storageEngine, prefix: 'something', separator: '_' }) ]
  })

  let logicWithStorage = kea({
    path: () => ['scenes', 'persist', 'index'],
    actions: () => ({
      setNumber: number => ({ number })
    }),
    reducers: ({ actions }) => ({
      number: [12, PropTypes.number, { persist: true }, {
        [actions.setNumber]: (_, payload) => payload.number
      }],
      override: [22, PropTypes.number, { persist: true, prefix: 'nope', separator: '|' }, {
        [actions.setNumber]: (_, payload) => payload.number
      }]
    })
  })

  expect(getPluginContext('localStorage').storageEngine).toBeDefined()
  expect(getPluginContext('localStorage').storageEngine).toBe(storageEngine)

  logicWithStorage.mount()
  logicWithStorage.actions.setNumber(55)

  const { number, override } = logicWithStorage.values

  expect(number).toBe(55)
  expect(override).toBe(55)

  expect(storageEngine['something_scenes_persist_index_number']).toBe('55')
  expect(storageEngine['nope|scenes|persist|index|override']).toBe('55')
})

test('works with extended logic', () => {
  const storageEngine = {}

  resetContext({
    createStore: true,
    plugins: [ storagePlugin({ storageEngine }) ]
  })

  let logic = kea({
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

  logic.extend({
    reducers: ({ actions }) => ({
      otherNumber: [12, PropTypes.number, { persist: true }, {
        [actions.setNumber]: (_, payload) => payload.number
      }]
    })
  })

  logic.mount()
  logic.actions.setNumber(55)

  const { number, otherNumber } = logic.values

  expect(number).toBe(55)
  expect(otherNumber).toBe(55)

  expect(storageEngine['scenes.persist.index.number']).toBe('55')
  expect(storageEngine['scenes.persist.index.otherNumber']).toBe('55')
})

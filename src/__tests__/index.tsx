import { kea, resetContext, getContext, getPluginContext, useValues, Provider, actions, path } from 'kea'
import { localStoragePlugin, persistentReducers } from '../index' // install the plugin

import React from 'react'
import PropTypes from 'prop-types'
import { mount, configure } from 'enzyme'
import Adapter from 'enzyme-adapter-react-16'

configure({ adapter: new Adapter() })

test('can save to storage', () => {
  const storageEngine = {} as any

  resetContext({
    plugins: [localStoragePlugin({ storageEngine })],
  })

  const logicWithStorage = kea([
    path(['scenes', 'persist', 'index']),
    actions({
      setNumber: (number) => ({ number }),
    }),
    persistentReducers({
      number: [
        12,
        { persist: true },
        {
          setNumber: (_, payload) => payload.number,
        },
      ],
    }),
  ])

  expect(getPluginContext('localStorage').storageEngine).toBeDefined()
  expect(getPluginContext('localStorage').storageEngine).toBe(storageEngine)
  expect(storageEngine['scenes.persist.index.number']).not.toBeDefined()

  expect(getContext().plugins.activated.map((p) => p.name)).toEqual(['core', 'localStorage'])

  const unmount1 = logicWithStorage.mount()

  expect(logicWithStorage.cache.localStorageDefaults.number).toBe(12)
  expect(logicWithStorage.values.number).toBe(12)

  logicWithStorage.actions.setNumber(42)

  expect(logicWithStorage.cache.localStorageDefaults.number).toBe(12)
  expect(logicWithStorage.values.number).toBe(42)

  unmount1()

  // do it all again

  resetContext({
    createStore: true,
    plugins: [localStoragePlugin({ storageEngine })],
  })

  const anotherLogicWithStorage = kea([
    path(['scenes', 'persist', 'index']),
    actions({
      setNumber: (number) => ({ number }),
    }),
    persistentReducers({
      number: [
        12,
        { persist: true },
        {
          setNumber: (_, payload) => payload.number,
        },
      ],
    }),
  ])

  expect(getPluginContext('localStorage').storageEngine).toBeDefined()
  expect(getPluginContext('localStorage').storageEngine).toBe(storageEngine)
  expect(storageEngine['scenes.persist.index.number']).toBeDefined()

  expect(getContext().plugins.activated.map((p) => p.name)).toEqual(['core', 'localStorage'])

  const unmount2 = anotherLogicWithStorage.mount()

  expect(anotherLogicWithStorage.cache.localStorageDefaults.number).toBe(12)
  expect(anotherLogicWithStorage.values.number).toBe(42)
  unmount2()
})

test('prefix and separator work', () => {
  const storageEngine = {
    items: {},
    setItem(key, value) {
      this.items[key] = value
    },
    removeItem(key) {
      delete this.items[key]
    },
  } as any
  resetContext({
    createStore: true,
    plugins: [localStoragePlugin({ storageEngine, prefix: 'something', separator: '_' })],
  })

  let logicWithStorage = kea([
    path(['scenes', 'persist', 'index']),
    actions({
      setNumber: (number) => ({ number }),
    }),
    persistentReducers({
      number: [
        12,
        {
          setNumber: (_, payload) => payload.number,
        },
      ],
      override: [
        22,
        { prefix: 'nope', separator: '|' },
        {
          setNumber: (_, payload) => payload.number,
        },
      ],
    }),
  ])

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
  const storageEngine = {} as any

  resetContext({
    createStore: true,
    plugins: [localStoragePlugin({ storageEngine })],
  })

  let logic = kea([
    path(['scenes', 'persist', 'index']),
    actions({
      setNumber: (number) => ({ number }),
    }),
    persistentReducers({
      number: [
        12,
        {
          setNumber: (_, payload) => payload.number,
        },
      ],
    }),
  ])

  logic.extend([
    persistentReducers({
      otherNumber: [
        12,
        { persist: true },
        {
          setNumber: (_, payload) => payload.number,
        },
      ],
    }),
  ] as any)

  logic.mount()
  logic.actions.setNumber(55)

  const { number, otherNumber } = logic.values

  expect(number).toBe(55)
  expect(otherNumber).toBe(55)

  expect(storageEngine['scenes.persist.index.number']).toBe('55')
  expect(storageEngine['scenes.persist.index.otherNumber']).toBe('55')
})

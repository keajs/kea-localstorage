import { getPluginContext, setPluginContext } from 'kea'

let localStorageEngine

try {
  localStorageEngine = window.localStorage

  const x = '__storage_test__'
  localStorageEngine.setItem(x, x)
  localStorageEngine.removeItem(x)
} catch (e) {
  localStorageEngine = undefined
}

const localStoragePlugin = ({ prefix = '', separator = '.', storageEngine = localStorageEngine } = {}) => ({
  name: 'localStorage',

  events: {
    afterPlugin () {
      setPluginContext('localStorage', { storageCache: {}, storageEngine })
    },

    beforeCloseContext (context) {
      setPluginContext('localStorage', { storageCache: {}, storageEngine })
    }
  },

  buildOrder: {
    localStorage: { after: 'reducers' }
  },

  buildSteps: {
    localStorage (logic, input) {
      if (!storageEngine) {
        return
      }

      const keysToPersist = Object.keys(logic.reducerOptions).filter(key => logic.reducerOptions[key].persist)

      if (Object.keys(keysToPersist).length === 0) {
        return
      }

      if (!input.path) {
        console.error('Logic store must have a path specified in order to persist reducer values')
        return
      }

      const { storageCache } = getPluginContext('localStorage')

      keysToPersist.forEach(key => {
        const _prefix = logic.reducerOptions[key].prefix || prefix
        const _separator = logic.reducerOptions[key].separator || separator

        const path = `${_prefix ? _prefix + _separator : ''}${logic.path.join(_separator)}${_separator}${key}`
        const defaultReducer = logic.reducers[key]

        if (typeof storageEngine[path] !== 'undefined') {
          logic.defaults[key] = JSON.parse(storageEngine[path])
        }

        storageCache[path] = logic.defaults[key]

        logic.reducers[key] = (state = logic.defaults[key], payload) => {
          const result = defaultReducer(state, payload)
          if (storageCache[path] !== result) {
            storageCache[path] = result
            storageEngine[path] = JSON.stringify(result)
          }
          return result
        }
      })
    }
  }
})

export default localStoragePlugin

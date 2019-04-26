let storageCache = {}
let localStorageEngine

try {
  localStorageEngine = window.localStorage

  const x = '__storage_test__'
  localStorageEngine.setItem(x, x)
  localStorageEngine.removeItem(x)
} catch (e) {
  localStorageEngine = undefined
}

export const configure = (storageEngine) => ({
  name: 'localStorage',

  // logic.reducerInputs is an object with the following structure:
  // { key: { reducer, value, type, options } }
  afterReducers (logic, input) {
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

    logic.storageEngine = storageEngine

    keysToPersist.forEach(key => {
      const path = `${logic.path.join('.')}.${key}`
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
  },

  clearCache () {
    storageCache = {}
  }
})

const plugin = configure(localStorageEngine)
plugin.configure = configure

export default plugin

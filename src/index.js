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

export default (storageEngine = localStorageEngine) => ({
  name: 'storage',

  // output.reducerInputs is an object with the following structure:
  // { key: { reducer, value, type, options } }
  afterReducerInputs (input, output) {
    if (!storageEngine) {
      return
    }

    const keysToPersist = Object.keys(output.reducerInputs).filter(key => output.reducerInputs[key].options && output.reducerInputs[key].options.persist)

    if (Object.keys(keysToPersist).length === 0) {
      return
    }

    if (!input.path) {
      console.error('Logic store must have a path specified in order to persist reducer values')
      return
    }

    output.storageEngine = storageEngine

    keysToPersist.forEach(key => {
      const reducerInput = output.reducerInputs[key]

      const path = `${output.path.join('.')}.${key}`
      const defaultReducer = reducerInput.reducer

      if (typeof storageEngine[path] !== 'undefined') {
        reducerInput.value = JSON.parse(storageEngine[path])
      }

      storageCache[path] = reducerInput.value

      reducerInput.reducer = (state = reducerInput.value, payload) => {
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

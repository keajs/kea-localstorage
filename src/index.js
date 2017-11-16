let storageCache = {}

let hasLocalStorage = false
let storage = {}

try {
  storage = window.localStorage

  const x = '__storage_test__'
  storage.setItem(x, x)
  storage.removeItem(x)

  hasLocalStorage = true
} catch (e) {
  // not available
}

export default {
  name: 'localStorage',

  // can be used globally and locally
  global: true,
  local: true,

  // reducerObjects is an object with the following structure:
  // { key: { reducer, value, type, options } }
  mutateReducerObjects (input, output, reducerObjects) {
    if (hasLocalStorage && input.path) {
      Object.keys(reducerObjects).filter(key => reducerObjects[key].options && reducerObjects[key].options.persist).forEach(key => {
        const path = `${output.path.join('.')}.${key}`
        const defaultValue = reducerObjects[key].value
        const defaultReducer = reducerObjects[key].reducer

        const value = storage[path] ? JSON.parse(storage[path]) : defaultValue
        storageCache[path] = value

        const reducer = (state = value, payload) => {
          const result = defaultReducer(state, payload)
          if (storageCache[path] !== result) {
            storageCache[path] = result
            storage[path] = JSON.stringify(result)
          }
          return result
        }

        reducerObjects[key].reducer = reducer
        reducerObjects[key].value = value
      })
    }
  },

  clearCache () {
    storageCache = {}
  }
}

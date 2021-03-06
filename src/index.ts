import { getPluginContext, KeaPlugin, setPluginContext } from 'kea'

export interface LocalStoragePluginOptions {
  prefix: string
  separator: string
  storageEngine: Storage | undefined
}

let localStorageEngine: Storage | undefined

try {
  localStorageEngine = window.localStorage

  const x = '__storage_test__'
  localStorageEngine.setItem(x, x)
  localStorageEngine.removeItem(x)
} catch (e) {
  localStorageEngine = undefined
}

export const localStoragePlugin = (pluginOptions: Partial<LocalStoragePluginOptions> = {}): KeaPlugin => {
  const prefix = pluginOptions.prefix ?? ''
  const separator = pluginOptions.separator ?? '.'
  const storageEngine = pluginOptions.storageEngine ?? localStorageEngine

  return {
    name: 'localStorage',

    events: {
      afterPlugin() {
        setPluginContext('localStorage', { storageCache: {}, storageEngine })
      },

      beforeCloseContext(context) {
        setPluginContext('localStorage', { storageCache: {}, storageEngine })
      },
    },

    buildOrder: {
      localStorage: { after: 'reducers' },
    },

    buildSteps: {
      localStorage(logic, input) {
        if (!storageEngine) {
          return
        }

        const keysToPersist = Object.keys(logic.reducerOptions).filter((key) => {
          return logic.reducerOptions[key].persist && !logic.cache.localStorage?.[key] // we might be in logic.extend
        })

        if (Object.keys(keysToPersist).length === 0) {
          return
        }

        if (!logic.cache.localStorage) {
          logic.cache.localStorage = {} as Record<string, boolean>
        }

        if (!logic.cache.localStorageDefaults) {
          logic.cache.localStorageDefaults = {}
        }

        if (!input.path && logic.pathString.indexOf('kea.logic.') === 0) {
          console.error('Logic store must have a path specified in order to persist reducer values')
          return
        }

        const { storageCache } = getPluginContext('localStorage')

        keysToPersist.forEach((key) => {
          const _prefix = logic.reducerOptions[key].prefix || prefix
          const _separator = logic.reducerOptions[key].separator || separator

          const path = `${_prefix ? _prefix + _separator : ''}${logic.path.join(_separator)}${_separator}${key}`
          const defaultReducer = logic.reducers[key]

          logic.cache.localStorageDefaults[key] = logic.defaults[key]

          if (typeof storageEngine[path] !== 'undefined') {
            logic.defaults[key] = JSON.parse(storageEngine[path])
          }

          storageCache[path] = logic.defaults[key]

          logic.reducers[key] = (state = logic.defaults[key], payload: any) => {
            const result = defaultReducer(state, payload)
            if (storageCache[path] !== result) {
              storageCache[path] = result
              storageEngine[path] = JSON.stringify(result)
            }
            return result
          }
          logic.cache.localStorage[key] = true
        })
      },
    },
  }
}


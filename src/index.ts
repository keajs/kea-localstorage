import {
  reducers,
  getPluginContext,
  KeaPlugin,
  Logic,
  ReducerActions,
  ReducerDefault,
  setPluginContext,
  defaults,
} from 'kea'

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

export type PersistenceOptions = {
  persist?: true
  prefix?: string
  separator?: string
}

export type PersistentReducerDefinitions<L extends Logic> = {
  [K in keyof L['reducers']]?:
    | [
        ReducerDefault<L['reducers'][K], L['props']>,
        PersistenceOptions,
        ReducerActions<L, ReturnType<L['reducers'][K]>>,
      ]
    | [ReducerDefault<L['reducers'][K], L['props']>, ReducerActions<L, ReturnType<L['reducers'][K]>>]
    | [ReducerDefault<L['reducers'][K], L['props']>]
    | ReducerActions<L, ReturnType<L['reducers'][K]>>
}

export const localStoragePlugin = (pluginOptions: Partial<LocalStoragePluginOptions> = {}): KeaPlugin => {
  const prefix = pluginOptions.prefix ?? ''
  const separator = pluginOptions.separator ?? '.'
  const storageEngine = pluginOptions.storageEngine ?? localStorageEngine

  return {
    name: 'localStorage',

    events: {
      afterPlugin() {
        setPluginContext('localStorage', { storageCache: {}, storageEngine, prefix, separator })
      },
    },
  }
}

export function persistentReducers<L extends Logic = Logic>(
  input: PersistentReducerDefinitions<L> | ((logic: L) => PersistentReducerDefinitions<L>),
) {
  return (logic) => {
    const { storageCache, storageEngine, prefix, separator } = getPluginContext('localStorage')

    if (!storageEngine) {
      throw new Error(`[KEA] LocalStorage plugin requires a "storageEngine"`)
    }
    if (logic.pathString.indexOf('kea.logic.') === 0) {
      throw new Error('[KEA] Logic must have a unique path to persist reducers')
    }

    logic.cache.localStorage ??= {} as Record<string, boolean>
    logic.cache.localStorageDefaults ??= {}

    const reducersInput = typeof input === 'function' ? input(logic) : input

    for (const [key, opts] of Object.entries(reducersInput)) {
      let _prefix = prefix
      let _separator = separator
      if (Array.isArray(opts) && opts.length === 3) {
        _prefix = opts[1].prefix || _prefix
        _separator = opts[1].separator || _separator
      }
      let _reducers: ReducerActions<L, any> = Array.isArray(opts)
        ? opts.length > 1
          ? opts[opts.length - 1]
          : {}
        : opts
      let _default = Array.isArray(opts) ? opts[0] : null

      const path = `${_prefix ? _prefix + _separator : ''}${logic.path.join(_separator)}${_separator}${key}`
      logic.cache.localStorageDefaults[key] = logic.defaults[key] ?? _default

      defaults({ [key]: _default ?? null })(logic)

      if (typeof storageEngine[path] !== 'undefined') {
        logic.defaults[key] = JSON.parse(storageEngine[path])
      }

      storageCache[path] = logic.defaults[key]

      const reducerActions = {}
      for (const [key, reducer] of Object.entries(_reducers)) {
        reducerActions[key] = (state, payload) => {
          const result = reducer(state, payload)
          if (storageCache[path] !== result) {
            storageCache[path] = result
            storageEngine[path] = JSON.stringify(result)
          }
          return result
        }
      }
      reducers({ [key]: reducerActions })(logic)
      logic.cache.localStorage[key] = true
    }
  }
}

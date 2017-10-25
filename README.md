![NPM Version](https://img.shields.io/npm/v/kea-thunk.svg)

Perstist Kea reducers in localstorage

* kea-localstorage 0.1 works with kea 0.27+

[Read the documentation for Kea](https://kea.js.org/)

# Usage

Install via yarn or npm

```sh
yarn add kea-localstorage
npm install --save kea-localstorage
```

Import `kea-localstorage` and add it to the plugins array in your `getStore` helper. Make sure to do all of this before any calls to `kea({})` take place

```js
// store.js
import localStoragePlugin from 'kea-localstorage'

// activate globally
const store = getStore({
  plugins: [
    localStoragePlugin
  ]
})

// use locally
const someLogic = kea({
  path: () => ['scenes', 'something', 'foobar'],

  actions: () => ({
    change: value => ({ value })
  }),

  reducers: ({ actions }) => ({
    persistedValue: [0, PropTypes.number, { localstorage: true }, {
      [actions.change]: (_, payload) => payload.value
    }]
  }),

  // if not activated globally and you only want to use it for one logic store
  plugins: [
    localStoragePlugin
  ]
})
```

If you wish to manually install the plugin without the `getStore` helper, do as follows:

```js
import { activatePlugin } from 'kea'
import localStoragePlugin from 'kea-localstorage'

activatePlugin(localStoragePlugin)
```

If you wish to only use this plugin in a few specific logic stores, add it to their respective plugins list:

```js
import { kea } from 'kea'
import localStoragePlugin from 'kea-localstorage'

const someLogic = kea({
  // actions, reducers, ...
  plugins: [
    localStoragePlugin
  ]
})
```

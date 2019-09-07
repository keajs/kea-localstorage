![NPM Version](https://img.shields.io/npm/v/kea-thunk.svg)

Perstist Kea reducers in localstorage

* kea-localstorage 0.1 works with kea 0.27+

[Read the documentation for Kea](https://kea.js.org/)

# Installation

Install via yarn or npm

```sh
yarn add kea-localstorage
npm install --save kea-localstorage
```

You may install the localStorage plugin either globally (automatically accessible for all logic stores) or locally (only for those you specify)..

To install it globaly, use one of the following ways. Make sure to run this before any call to `kea({})` takes place.

```js
// the cleanest way
import localStoragePlugin from 'kea-localstorage'
import { getStore } from 'kea'

const store = getStore({
  plugins: [ localStoragePlugin ]
})

// another way
import localStoragePlugin from 'kea-localstorage'
import { activatePlugin } from 'kea'

activatePlugin(localStoragePlugin)

// the shortest way
import 'kea-localstorage/install'
```

To install it locally, just add it to the `plugins` array for your logic store. Then only this logic store will have access to the functionality:

```js
// use locally
const someLogic = kea({
  plugins: [
    localStoragePlugin
  ],

  // actions, reducers, etc
})
```

# Usage

To use it, make sure your logic store has a defined `path`. Then just pass `{ persist: true }` as an option to your reducer, like so:

```js
// use locally
const someLogic = kea({
  path: () => ['scenes', 'something', 'foobar'], // NEEDED!

  actions: () => ({
    change: value => ({ value })
  }),

  reducers: ({ actions }) => ({
    persistedValue: [0, PropTypes.number, { persist: true }, {
      [actions.change]: (_, payload) => payload.value
    }]
  })
})
```

# Options

* prefix - you can add to all you localStorage paths some prefix. 
    > This can be useful, if you have two SPA on one domain, for example.
* separator - to change symbol that concat path parts

#### To use them globally
```js
// import configure func
import { configure as localStoragePlugin } from 'kea-localstorage';
import { getStore } from 'kea'

// call plugin as function, and pass object with params in first arg
const store = getStore({
  plugins: [ localStoragePlugin({ prefix: 'example', separator: '_' }) ]
})

```
So all persisted reducers now save in path: `exapmle_scenes_something_foobar`

#### To use prefix locally for specific reducer (you can combine it with global prefix and separator)
```js
const someLogic = kea({
  path: () => ['scenes', 'something', 'foobar'],

  reducers: ({ actions }) => ({
    // somewhere in your kea logic reducers
    persistedValue: [0, PropTypes.number, { persist: 'example' }, {
      [actions.change]: (_, payload) => payload.value
    }]
  })
})
```

So `persistedValue` saved not in path: `scenes.something.foobar`, but `example.scenes.something.foobar`

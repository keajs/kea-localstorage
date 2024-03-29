# Change Log

All notable changes to this project will be documented in this file.

## 3.1.0 - 2022-12-04

- Add global `storageKey`

## 3.0.0 - 2022-05-12

- Support Kea 3.0

## 1.1.2 - 2021-10-19

- Fix package.json paths.

## 1.1.1 - 2021-06-27

- Fix undefined default options bug

## 1.1.0 - 2021-06-26

- Convert to TypeScript

## 1.0.2 - 2020-04-17

- Added `logic.cache.localStorageDefaults[reducerKey]` to hold on to the original default of the reducer
- Fixed edge case where a reducer with the key `stored` would never be stored in localStorage if defined
  in a `logic.extend()` call

## 1.0.1 - 2020-04-13

- Fixed bug where extending a logic with stored values would re-store the values
- Fixed bug where using in .extend() would require a path to be given again

## 1.0.0 - 2019-09-12

- Works with kea 1.0.
- Use `localStoragePlugin.configure(storageEngine)` to provide an alternative storage engine

## 0.3.0 - 2019-09-07

- Add configure (prefix and separator) to plugin

## 0.1.0 - 2017-10-25

- First version

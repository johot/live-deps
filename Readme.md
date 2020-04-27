# live-deps

_Work with your dependencies locally and see the changes in your app live, like `npm link` but better._

## What?

`TODO`

## Why?

`TODO`

## Installation

```
npm i live-deps --save-dev
```

## Usage

In your `package.json` add the following:

```json
"liveDependencies": {
  "your-package-name": "..\\your-package-name"
},
```

Then run the command:

```
npx live-deps link
```

This will symlink all the folders in the folder of your package _except_ the `node_modules` folder.

> By avoiding symlinking your `node_modules` we simulate a real install in a better way and avoid problems like dual versions of React etc being loaded causing runtime errors.

### ⚠️ Prerequisites and caveats ⚠️

You still need to publish your package to `npm` (or your own private register or using a tool like yalc) at least once + everytime a major change to your package (such as adding a new dependency) is performed.

The reason for this is that during a `npm i` the package will always try to reinstall from a real location.

`live-deps` should therefor be used when you quickly want to test smaller changes to your library.

## Other great tools for locally developing packages

- Yalc

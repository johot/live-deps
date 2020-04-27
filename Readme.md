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

**⚠️ Prerequisites and caveats ⚠️**

- You still need to publish your package to `npm` (or your own private register / by using a tool like [yalc](https://github.com/whitecolor/yalc)) at least **once** + **everytime a change to your package dependencies is performed**.

  > The reason for this is that during a `npm i` the package will always try to reinstall from a real location. That means your symlink may be overwritte and any new dependencies you added to your symlinked version will not be detected.

- Symlinks needs to be resolved correctly by Webpack and TypeScript, for Webpack this means setting `resolve.symlinks` to `false` and for TypeScript setting `preserveSymlinks: true` in `tsconfig.json`.

<hr>

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

# Live Package

_Work with your packages (design systems / component libraries etc) locally in your app with live reloading!_

Optimized to work with [`create-react-app`](https://github.com/facebook/create-react-app) (without ejecting!), but can also be used for other setups.

## Why?

When developing an npm package you often want to test that it works in a real project. This is especially true when building something like a React component library or design system where you also want to verify that the design looks good on the page.

Npm has a tool called `npm link` that allows developers to create a symlink between your package and your apps `node_modules` folder, basically "tricking" your app into thinking the package have been installed even though it is somewhere else. This sounds good in theory but in practice `npm link` only works for the most simple cases.

Many of todays advanced build tools gets confused by symlinks when for example walking the directory or file tree producing errors or including libraries such as React twice in a project (leading to even more errors). Some tools even have special config sections just for dealing with symlinks...

**So in a nutshell:** It's just too hard getting `npm link` to work for most scenarios, especially when dealing with React (or similair libraries) and component libraries / design systems.

This is where `live-package` comes in with a much simpler solution.

## How

Instead of dealing with symlinks `live-package` will simply watch the dist / build folder of your package and manually sync these to your apps `node_modules` folder _without using any symlinks_.

> **Isn't that slow?**  
> Most of the time no, since it uses a file watcher to only sync files when a change is detected. With that said it could get slow if you for example clean the package dist folder every time a change is made. Therefore it's important to use an incremental build process of your package (if possible), for example something like `tsc --watch`.

On top of this, when using `create-react-app` for your project it also enables live reloading of your page when the package changes in any way.

> **Can't `create-react-app` already handle this?**  
> No unfortunately not... `create-react-app` will not watch for changes to the `node_modules` folder. Luckily `live-package` fixes this by overriding parts of the hidden webpack config `create-react-app` uses under the hood (by using `react-app-rewired`) to enable live reloading and rebuilding for any changes to the `node_modules\<your package>` folder. No need to eject!

It just works!

## Install

```sh
npm i live-package -g
```

## Usage

### List available commands

```sh
live-package --help
```

### For Create React App projects

The easiest way to get started is to run the following command (in the root folder of your React app):

```sh
live-package cra-init
```

Then follow the instructions by inputting the path to the dist folder of your locally built package.

When done run the command:

```sh
npm run start:lp
```

`live-package` will now start watching the selected package dist folder for changes and sync it to your `node_modules` folder. When a change is detected it will live reload your webpack dev server. Simple as that!

> Since `create-react-app` normally won't watch for changes outside the `src` and `public` folder `live-package` uses `react-app-rewired` to inject a modified webpack dev server config. This means you don't have to eject your `create-react-app` config to enable this behavior!

### Using for other (non `create-react-app` projects)

For projects that don't use `create-react-app` your only need to add the `live-package sync <packageDistFolder>` command to the script section of your `package.json`:

```json
...
 "sync-package": "live-package sync \"path/to/my/package/dist\""
...
```

You would then just do a `npm run sync-package` in a separate terminal window and then launch your project with the command of choice.

> **Note:** For most projects you would also need to make sure your build tool (such as webpack) is configured to watch your `node_modules` folder if you want something like live reloading.

### Things to consider

Since files are manually synced to your `node_modules` folder using a file watcher you should try to enable an incremental build process in your package, something similair to `tsc --watch` (for TypeScript users).

_Enjoy!_

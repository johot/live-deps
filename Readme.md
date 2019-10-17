# Live Package
*Work with your packages (design systems / component libraries etc) locally in your app with live reloading!*

Optimized to work with [`create-react-app`](https://github.com/facebook/create-react-app) (without ejecting!), but can also be used for other setups.

## Why?
`Todo`

## Install
```sh
npm i live-package -g
```

## Usage
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
`Todo`

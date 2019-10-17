import fs from "fs";
import npmRun from "npm-run";
import sdir from "sync-directory";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import concurrently from "concurrently";
import npmAddScript from "npm-add-script";
import debounce from "debounce";

export function devServer(configFunction: any, packageName: string) {
  if (!packageName) throw Error("You didn't specify a package name for the live-package dev server!");

  const overrideFn = function(proxy: any, allowedHost: any) {
    const defaultConfig = configFunction(proxy, allowedHost);

    //+(?!some_npm_module_name)
    ///^(?!C:\/...\/src\/).+\/node_modules\//g
    //const newRegex = defaultConfig.watchOptions.ignored.toString().replace("node_modules/", "node_modules/+(?!xxx)");

    // Ignore nothing
    // TODO: Make more fine grained to only look for the package folder in node_modules instead
    defaultConfig.watchOptions.ignored = [];

    // We watch the node_modules folder for the package, it seems however webpack dev server only looks at the root folder
    // so we will create a little "hack" by adding a new file to this folder with random content called ".live-reload"
    // I guess (and hope) a better way exists, please let me know :) /johot
    defaultConfig.contentBase = [defaultConfig.contentBase, path.join(process.cwd(), "node_modules", packageName)];

    return defaultConfig;
  };

  return overrideFn;
}

export function startLivePackageCra(packageDistFolder: string) {
  concurrently(["react-app-rewired start", 'live-package sync "' + packageDistFolder + '"']);
}

export async function initializeLivePackageCra() {
  const packageDistFolder = await getCommandLineAnswer(
    "What is the path the your packages dist folder?",
    undefined,
    "input"
  );
  console.log(chalk.yellow("Initializing live-package..."));

  console.log(chalk.magentaBright('- Intalling "react-app-rewired" from npm as a dev dependency...'));
  npmRun.execSync("npm i react-app-rewired --save-dev");

  console.log(chalk.magentaBright("- Creating react-app-rewired config file..."));
  const packageName = getPackageNameFromDistFolder(packageDistFolder);
  fs.writeFile("config-overrides.js", getConfigOverridesFile(packageName), err => {});

  console.log(chalk.magentaBright('- Intalling "live-package" from npm as a dev dependency...'));
  npmRun.execSync("npm i live-package --save-dev");

  console.log(chalk.magentaBright('- Adding "live-package" command to package.json scripts...'));
  tryAddNpmScriptLine("start:lp", 'live-package cra-start "' + packageDistFolder + '"');
  console.log(chalk.yellow("light-package initialized! ✔️"));
  console.log(
    chalk.magentaBright('Run command "') +
      chalk.yellow("npm run start:lp") +
      chalk.magentaBright(
        `\" to start your React app with live-package reloading for package: \"${chalk.yellow(packageName)}\" 👍`
      )
  );
}

function getConfigOverridesFile(packageDistFolder: string) {
  return `/* config-overrides.js */
    const livePackageDevServer = require("live-package").devServer;
    
    module.exports = {
      // The function to use to create a webpack dev server configuration when running the development
      // server with 'npm run start' or 'yarn start'.
      // Example: set the dev server to use a specific certificate in https.
      devServer: configFunction => livePackageDevServer(configFunction, "${packageDistFolder}")
    };
    `;
}

export async function getCommandLineAnswer<T = string | boolean>(
  message: string,
  defaultAnswer: T,
  type: "input" | "confirm"
): Promise<T> {
  const answers = await inquirer.prompt([
    {
      type: type,
      name: "question",
      message: message,
      default: defaultAnswer
    }
  ]);

  return answers.question;
}

export function tryAddNpmScriptLine(key: string, value: string) {
  try {
    npmAddScript({ key: key, value: value });
  } catch (ex) {}
}

/* config-overrides.js */
// const livePackageDevServer = require("live-package").devServer;

// module.exports = {
//   // The function to use to create a webpack dev server configuration when running the development
//   // server with 'npm run start' or 'yarn start'.
//   // Example: set the dev server to use a specific certificate in https.
//   devServer: livePackageDevServer
// };

function getPackageNameFromDistFolder(packageDistFolder: string) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageDistFolder, "package.json"), "utf8"));
  const packageName = packageJson.name;
  return packageName;
}

export function startLivePackageSyncing(packageDistFolder: string) {
  const workingDirectory = process.cwd();
  // Get the package name from the package json
  const packageName = getPackageNameFromDistFolder(packageDistFolder);
  const nodeModulesOutFolder = path.join(workingDirectory, "node_modules", packageName);

  console.log(
    chalk.magentaBright(
      'Watching dist folder "' +
        chalk.yellow(packageDistFolder) +
        '" for changes, syncing to: "' +
        chalk.yellow(nodeModulesOutFolder) +
        '"'
    )
  );

  // TODO: Find a better way via webpack config (if a way exists?)
  const debouncedForceLiveReload = debounce(forceLiveReload, 200) as (
    workingDirectory: string,
    packageName: string
  ) => void;

  debouncedForceLiveReload(workingDirectory, packageName);

  sdir(packageDistFolder, nodeModulesOutFolder, {
    watch: true,
    cb: (data: any) => {
      console.log(
        chalk.magentaBright("live-package detected change: ") +
          chalk.yellow(data.path) +
          " " +
          chalk.redBright("syncing...")
      );

      // Debounced so we don't run it when we don't need to
      debouncedForceLiveReload(workingDirectory, packageName);
    }
  });

  // Forces webpack dev server to reload by changing the content of a dummy file in the root of the package
  function forceLiveReload(workingDirectory: string, packageName: string) {
    // TODO: Make smarter
    const packageFolder = path.join(workingDirectory, "node_modules", packageName);
    const triggerFile = path.join(packageFolder, ".live-package");

    // Just change the file with random data
    fs.writeFileSync(triggerFile, new Date().toString());

    console.log("live-package: Reloading webpack dev server...");
  }
}

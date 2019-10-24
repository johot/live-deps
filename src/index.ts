import fs from "fs";
import npmRun from "npm-run";
import path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import npmAddScript from "npm-add-script";

export function modifyWebpack(config: any, packageName: string, packageFolder: string): any {
  config.resolve.plugins = config.resolve.plugins.filter((p: any) => {
    // Remove the ModuleScopePlugin or we will not be allowed so alias things outside the src folder
    if (p && p.constructor && p.constructor.name && p.constructor.name.toString() === "ModuleScopePlugin") {
      return false;
    }

    return true;
  });

  config.resolve.alias = { ...config.resolve.alias, [packageName]: packageFolder };
  return config;
}

export async function initializeLivePackageCra() {
  const packageFolder = await getCommandLineAnswer(
    "What is the path the your packages folder (where package.json is located)?",
    undefined,
    "input"
  );
  console.log(chalk.yellow("Initializing live-package..."));

  console.log(chalk.magentaBright("- Installing react-app-rewired from npm as a dev dependency..."));
  npmRun.execSync("npm i react-app-rewired --save-dev");

  console.log(chalk.magentaBright("- Creating react-app-rewired config file..."));
  const packageName = getPackageNameFromPackageFolder(packageFolder);
  fs.writeFile("config-overrides.js", getConfigOverridesFile(packageName, packageFolder), err => {});

  console.log(chalk.magentaBright("- Installing live-package from npm as a dev dependency..."));
  npmRun.execSync("npm i live-package --save-dev");

  console.log(chalk.magentaBright("- Adding live-package command to package.json scripts..."));
  tryAddNpmScriptLine("start:lp", "react-app-rewired start");
  console.log(chalk.yellow("live-package initialized! ✔️"));
  console.log(
    chalk.magentaBright('Run command "') +
      chalk.yellow("npm run start:lp") +
      chalk.magentaBright(
        `\" to start your React app with live-package reloading for package: \"${chalk.yellow(packageName)}\" 👍`
      )
  );
}

function getConfigOverridesFile(packageName: string, packageDistFolder: string) {
  return `/* config-overrides.js */
const livePackage = require("live-package");

module.exports = function override(config, env) {
 
  livePackage.modifyWebpack(config, ${JSON.stringify(packageName)}, ${JSON.stringify(packageDistFolder)});

  return config;
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

function getPackageNameFromPackageFolder(packageDistFolder: string) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageDistFolder, "package.json"), "utf8"));
  const packageName = packageJson.name;
  return packageName;
}

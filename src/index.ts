import fs from "fs";
import npmRun from "npm-run";
import path, { resolve } from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import npmAddScript from "npm-add-script";
import concurrently from "concurrently";

export function modifyWebpack(config: any): any {
  const livePackageConfig = getLivePackageConfig();

  // Set up webpack aliases for each package folder
  for (const packageFolder of livePackageConfig.packageConfigs[0].packageFolders) {
    const packageName = getPackageNameFromPackageFolder(packageFolder);
    config.resolve.alias = { ...config.resolve.alias, [packageName]: resolve(packageFolder) };
  }

  // Allow webpack to look outside src folder
  config.resolve.plugins = config.resolve.plugins.filter((p: any) => {
    // Remove the ModuleScopePlugin or we will not be allowed so alias things outside the src folder
    if (p && p.constructor && p.constructor.name && p.constructor.name.toString() === "ModuleScopePlugin") {
      return false;
    }

    return true;
  });

  return config;
}

interface LivePackageConfig {
  packageConfigs: PackageConfig[];
}

interface PackageConfig {
  packageFolders: string[];
  runPackageScript?: string;
}

export function getLivePackageConfig(): LivePackageConfig {
  const data = fs.readFileSync("live-package.json", "utf8");
  return JSON.parse(data) as LivePackageConfig;
}

export function startPackageNpmScript(scriptName: string, packageDistFolder: string) {
  console.log(
    chalk.magentaBright(
      `Starting package script: ${chalk.yellow(scriptName)} in folder: ${chalk.yellow(packageDistFolder)}`
    )
  );
  npmRun.execSync(`npm run ${scriptName}`, { cwd: resolve(packageDistFolder) });
}

export function uninstallLivePackageCra() {
  tryUninstallTypeScriptConfig();
}

export function startLivePackageCra() {
  const config = getLivePackageConfig();

  if (config.packageConfigs.length !== 1) {
    throw new Error("Live-package currently only supports one package but we can include more in the future");
  }

  tryModifyTypeScriptConfig(config);

  if (config.packageConfigs.length === 1) {
    if (config.packageConfigs[0].runPackageScript) {
      concurrently([
        "react-app-rewired start",
        `live-package package-start \"${getFirstFolderThatExists(config.packageConfigs[0].packageFolders)}\" ${
          config.packageConfigs[0].runPackageScript
        }`
      ]);
    } else {
      concurrently(["react-app-rewired start"]);
    }
  }
}

function getFirstFolderThatExists(folders: string[]) {
  const foundFolder = folders.find(folder => fs.existsSync(folder));
  return foundFolder;
}

function tryUninstallTypeScriptConfig() {
  if (fs.existsSync("tsconfig.json")) {
    const originalTsConfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));

    if (originalTsConfig.extends === "./tsconfig.live-package.json") {
      delete originalTsConfig.extends;

      fs.writeFileSync("tsconfig.json", JSON.stringify(originalTsConfig, undefined, 2));
    }

    fs.unlinkSync("tsconfig.live-package.json");
  }
}

function tryModifyTypeScriptConfig(config: LivePackageConfig) {
  if (fs.existsSync("tsconfig.json")) {
    // Add extends part
    const tsLivePackageConfig = {
      compilerOptions: {
        baseUrl: ".",
        paths: {}
      }
    };

    for (const packageConfig of config.packageConfigs) {
      (tsLivePackageConfig.compilerOptions.paths as any)[
        getPackageNameFromPackageFolder(getFirstFolderThatExists(packageConfig.packageFolders))
      ] = packageConfig.packageFolders;
    }

    fs.writeFileSync("tsconfig.live-package.json", JSON.stringify(tsLivePackageConfig, undefined, 2));

    // Extend original tsconfig.json (this is a workaround since CRA will otherwise override our tsconfig paths definition)
    const originalTsConfig = JSON.parse(fs.readFileSync("tsconfig.json", "utf8"));

    if (originalTsConfig.extends !== "./tsconfig.live-package.json") {
      originalTsConfig.extends = "./tsconfig.live-package.json";

      fs.writeFileSync("tsconfig.json", JSON.stringify(originalTsConfig, undefined, 2));
    }
  }
}

function createLivePackageConfigFile(packageFolder: string, runPackageScript: string): string {
  const config: LivePackageConfig = {
    packageConfigs: [
      {
        packageFolders: [packageFolder],
        runPackageScript: runPackageScript
      }
    ]
  };

  return JSON.stringify(config, undefined, 2);
}

export async function initializeLivePackageCra(skipInstallStep: boolean) {
  console.log(chalk.yellow(`Initializing live-package (${getLivePackageVersion()}) for create-react-app...`));

  const packageFolder = await getCommandLineAnswer(
    "What is the path the your packages folder (where package.json is located)?",
    undefined,
    "input"
  );

  const runPackageScript = await getCommandLineAnswer(
    "What script for building / watching do you want to run for your package (optional)?",
    undefined,
    "input"
  );

  if (!skipInstallStep) {
    console.log(chalk.magentaBright("- Installing react-app-rewired from npm as a dev dependency..."));
    npmRun.execSync("npm i react-app-rewired --save-dev");
  }

  console.log(chalk.magentaBright("- Creating react-app-rewired config file..."));
  const packageName = getPackageNameFromPackageFolder(packageFolder);
  fs.writeFileSync("config-overrides.js", getConfigOverridesFile(packageName, packageFolder));

  // Create config
  fs.writeFileSync("live-package.json", createLivePackageConfigFile(packageFolder, runPackageScript));

  if (!skipInstallStep) {
    console.log(chalk.magentaBright("- Installing live-package from npm as a dev dependency..."));
    npmRun.execSync("npm i live-package@latest --save-dev");
  }

  console.log(chalk.magentaBright("- Adding live-package command to package.json scripts..."));
  //  tryAddNpmScriptLine("start:lp", `live-package cra-start "${packageFolder}" ${packageScriptName}`.trim());
  tryAddNpmScriptLine("start:lp", "live-package cra-start");
  tryAddNpmScriptLine("stop:lp", "live-package cra-stop");

  console.log(chalk.yellow("live-package initialized! ✔️"));
  console.log(
    chalk.magentaBright("Run command ") +
      chalk.yellow("npm run start:lp") +
      chalk.magentaBright(
        ` to start your React app with live-package reloading for package: ${chalk.yellow(packageName)} 🎉`
      )
  );
}

export function getLivePackageVersion(): string {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    return packageJson.version;
  } catch (ex) {
    return "??? -> " + ex.toString();
  }
}

function getConfigOverridesFile(packageName: string, packageDistFolder: string) {
  return `/* config-overrides.js */
const livePackage = require("live-package");

module.exports = function override(config, env) {
 
  livePackage.modifyWebpack(config);

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
    npmAddScript({ key: key, value: value, force: true });
  } catch (ex) {}
}

function getPackageNameFromPackageFolder(packageDistFolder: string) {
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageDistFolder, "package.json"), "utf8"));
  const packageName = packageJson.name;
  return packageName;
}

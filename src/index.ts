import fs from "fs";
import npmRun from "npm-run";
import path, { resolve } from "path";
import chalk from "chalk";
import concurrently from "concurrently";
import { getLivePackageConfig, createLivePackageConfigFile, PackageConfig } from "./config";
import {
  getFirstFolderThatExists,
  getCommandLineAnswer,
  getPackageNameFromPackageFolder,
  getLivePackageVersion,
  tryAddNpmScriptLine,
  findNodeModuleFolders,
  packageJsonContainsDependency
} from "./util";

import { symlinkDir, tryUnsymlinkDir } from "./symlink";

export function startPackageNpmScript(scriptName: string, packageDistFolder: string) {
  console.log(
    chalk.magentaBright(
      `Starting package script: ${chalk.yellow(scriptName)} in folder: ${chalk.yellow(packageDistFolder)}`
    )
  );
  npmRun.execSync(`npm run ${scriptName}`, { cwd: resolve(packageDistFolder) });
}

export async function enableDisableLivePackage(enable: boolean) {
  const config = getLivePackageConfig();

  for (const packageConfigEntry of config.packageConfigs) {
    const symLinkDirs: string[][] = [];

    //const packageConfigEntry = config.packageConfigs[0];
    const packageName = getPackageNameFromPackageFolder(getPackageFolder(packageConfigEntry));
    const splitPackageName = packageName.split("/");
    const sourceFolder = getPackageFolder(packageConfigEntry);
    const destFolder = path.resolve(...["node_modules", ...splitPackageName]);
    symLinkDirs.push([sourceFolder, destFolder]);

    const nodeModuleFolders = findNodeModuleFolders(sourceFolder);

    // Back symlink dependencies
    for (const sharedDep of config.sharedDependencies) {
      for (const nodeModuleFolder of nodeModuleFolders) {
        const depDestFolder = path.resolve(nodeModuleFolder, sharedDep.name);

        if (fs.existsSync(depDestFolder)) {
          const depSourceFolder = path.resolve("node_modules", sharedDep.name);

          if (sharedDep.source === undefined || sharedDep.source === "app") {
            symLinkDirs.push([depSourceFolder, depDestFolder]);
          } else {
            // Switch it around!
            symLinkDirs.push([depDestFolder, depSourceFolder]);
          }
        }
      }
    }

    if (enable) {
      for (const sourceDest of symLinkDirs) {
        symlinkDir(sourceDest[0], sourceDest[1]);
      }
      console.log(chalk.magentaBright(`live-package for package ${chalk.yellow(packageName)} enabled`));
    } else {
      for (const sourceDest of symLinkDirs) {
        tryUnsymlinkDir(sourceDest[1]);
      }
      console.log(chalk.magentaBright(`live-package for package ${chalk.yellow(packageName)} disabled`));
    }
  }
}

export function startLivePackage() {
  const config = getLivePackageConfig();

  if (config.packageConfigs.length !== 1) {
    throw new Error("Live-package currently only supports one package but we can include more in the future");
  }

  if (config.packageConfigs.length === 1) {
    if (config.packageConfigs[0].packageBuildScript && config.packageConfigs[0].projectStartScript) {
      concurrently([
        "npm run " + config.packageConfigs[0].projectStartScript,
        `live-package run-package-script \"${getPackageFolder(config.packageConfigs[0])}\" ${
          config.packageConfigs[0].packageBuildScript
        }`
      ]);
    } else {
      throw new Error("You must set both runProjectScript and runPackageScript in your live-package.json file");
    }
  }
}

export async function initializeLivePackage() {
  console.log(chalk.yellow(`Initializing live-package (${getLivePackageVersion()}) for app...`));

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

  const packageName = getPackageNameFromPackageFolder(packageFolder);

  const sharedDependencies = [];

  // Let's make it easier for react developers
  if (packageJsonContainsDependency("react")) {
    sharedDependencies.push("react");
  }

  if (packageJsonContainsDependency("react-dom")) {
    sharedDependencies.push("react-dom");
  }

  // Create default config file
  fs.writeFileSync(
    "live-package.json",
    createLivePackageConfigFile(packageFolder, runPackageScript, sharedDependencies)
  );

  console.log(
    chalk.magentaBright(`- Adding live-package command (${chalk.yellow("start:lp")}) to package.json scripts...`)
  );
  tryAddNpmScriptLine("start:lp", "live-package link && live-package start");

  console.log(chalk.yellow("live-package initialized! ✔️"));
  console.log(
    chalk.magentaBright("Run command ") +
      chalk.yellow("npm run start:lp") +
      chalk.magentaBright(` to start your app with live-package reloading for package: ${chalk.yellow(packageName)} 🎉`)
  );
}

function getPackageFolder(packageConfig: PackageConfig): string {
  if (typeof packageConfig.packageFolder === "string") {
    return packageConfig.packageFolder;
  } else if (Array.isArray(packageConfig.packageFolder)) {
    return getFirstFolderThatExists(packageConfig.packageFolder);
  }

  throw new Error("Invalid package folder setting");
}

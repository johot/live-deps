import fs from "fs";
import npmRun from "npm-run";
import path, { resolve } from "path";
import chalk from "chalk";
import concurrently from "concurrently";
import { getLivePackageConfig, createLivePackageConfigFile } from "./config";
import {
  getFirstFolderThatExists,
  getCommandLineAnswer,
  getPackageNameFromPackageFolder,
  getLivePackageVersion,
  tryAddNpmScriptLine,
  findNodeModuleFolders
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

  const symLinkDirs: string[][] = [];

  const packageConfig = config.packageConfigs[0];
  const packageName = getPackageNameFromPackageFolder(packageConfig.packageFolder);
  const splitPackageName = packageName.split("/");
  const sourceFolder = packageConfig.packageFolder;
  const destFolder = path.resolve(...["node_modules", ...splitPackageName]);
  symLinkDirs.push([sourceFolder, destFolder]);

  const nodeModuleFolders = findNodeModuleFolders(sourceFolder);

  // Back symlink dependencies
  for (const dep of packageConfig.syncDependencies) {
    for (const nodeModuleFolder of nodeModuleFolders) {
      const depDestFolder = path.resolve(nodeModuleFolder, dep);

      if (fs.existsSync(depDestFolder)) {
        const depSourceFolder = path.resolve("node_modules", dep);
        symLinkDirs.push([depSourceFolder, depDestFolder]);
      }
    }
  }

  if (enable) {
    for (const sourceDest of symLinkDirs) {
      symlinkDir(sourceDest[0], sourceDest[1]);
    }
    console.log(
      chalk.magentaBright(`live-package for package ${chalk.yellow(packageName)} turned ${chalk.yellow("on")}`)
    );
  } else {
    for (const sourceDest of symLinkDirs) {
      tryUnsymlinkDir(sourceDest[1]);
    }
    console.log(
      chalk.magentaBright(`live-package for package ${chalk.yellow(packageName)} turned ${chalk.yellow("off")}`)
    );
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
        `live-package run-package-script \"${getFirstFolderThatExists([
          config.packageConfigs[0].packageFolder,
          ...(config.packageConfigs[0].fallbackFolders || [])
        ])}\" ${config.packageConfigs[0].packageBuildScript}`
      ]);
    } else {
      throw new Error("You must set both runProjectScript and runPackageScript in your live-package.json file");
    }
  }
}

export async function initializeLivePackage() {
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

  const packageName = getPackageNameFromPackageFolder(packageFolder);

  // Create default config file
  fs.writeFileSync("live-package.json", createLivePackageConfigFile(packageFolder, runPackageScript));

  console.log(chalk.magentaBright("- Adding live-package command to package.json scripts..."));
  tryAddNpmScriptLine("start:lp", "live-package on && live-package start");

  console.log(chalk.yellow("live-package initialized! ✔️"));
  console.log(
    chalk.magentaBright("Run command ") +
      chalk.yellow("npm run start:lp") +
      chalk.magentaBright(
        ` to start your React app with live-package reloading for package: ${chalk.yellow(packageName)} 🎉`
      )
  );
}

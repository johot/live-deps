#!/usr/bin/env node
"use strict";
import program from "commander";
import {
  initializeLivePackageCra,
  startPackageNpmScript,
  startLivePackageCra,
  getLivePackageVersion,
  uninstallLivePackageCra
} from "./index";

program.version(getLivePackageVersion());

program
  .command("cra-init [skipInstall]")
  .alias("cra")
  .description("initialize live-package in create-react-app project")
  .action(skipInstall => {
    const skip: boolean = skipInstall === "true" ? true : false;
    initializeLivePackageCra(skip);
  });

program
  .command("package-start <packageDistFolder> <scriptName>")
  .description("start a script in your package directory (for example watching build changes)")
  .action((packageDistFolder, scriptName) => {
    startPackageNpmScript(scriptName, packageDistFolder);
  });

program
  .command("cra-start")
  .description(
    "start syncing files and start your create-react-app using rewired, allowing cra to pickup changes to your package"
  )
  .action(() => {
    startLivePackageCra();
  });

program
  .command("cra-stop")
  .description("uninstall / stop live package changes (if you for example want to run your package from npm etc)")
  .action(() => {
    uninstallLivePackageCra();
  });

program.parse(process.argv);

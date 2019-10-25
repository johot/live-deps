#!/usr/bin/env node
"use strict";
import program from "commander";
import { initializeLivePackageCra, startPackageNpmScript, startLivePackageCra, getLivePackageVersion } from "./index";

program.version(getLivePackageVersion());

program
  .command("cra-init")
  .alias("cra")
  .description("initialize live-package in create-react-app project")
  .action(() => {
    initializeLivePackageCra();
  });

program
  .command("package-start <packageDistFolder> <scriptName>")
  .description("start a script in your package directory (for example watching build changes)")
  .action((packageDistFolder, scriptName) => {
    startPackageNpmScript(scriptName, packageDistFolder);
  });

program
  .command("cra-start <packageDistFolder> [scriptName]")
  .description(
    "start syncing files and start your create-react-app using rewired, allowing cra to pickup changes to your package"
  )
  .action((packageDistFolder, scriptName) => {
    startLivePackageCra(packageDistFolder, scriptName);
  });

program.parse(process.argv);

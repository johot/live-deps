#!/usr/bin/env node
"use strict";
import program from "commander";
import {
  initializeLivePackage,
  startPackageNpmScript as runPackageNpmScript,
  startLivePackage,
  enableDisableLivePackage
} from ".";
import { getLivePackageVersion } from "./util";

program.version(getLivePackageVersion());

program
  .command("init")
  .description("initialize live-package")
  .action(() => {
    initializeLivePackage();
  });

program
  .command("run-package-script <packageDistFolder> <scriptName>")
  .description("start a script in your package directory (for example watching build changes)")
  .action((packageDistFolder, scriptName) => {
    runPackageNpmScript(scriptName, packageDistFolder);
  });

program
  .command("start")
  .description("run a start script in your project and a watch script in your package very easily")
  .action(() => {
    startLivePackage();
  });

program
  .command("on")
  .description("uninstall / stop live package changes (if you for example want to run your package from npm etc)")
  .action(() => {
    enableDisableLivePackage(true);
  });

program
  .command("off")
  .description("uninstall / stop live package changes (if you for example want to run your package from npm etc)")
  .action(() => {
    enableDisableLivePackage(false);
  });

program.parse(process.argv);

#!/usr/bin/env node
"use strict";
import program from "commander";
import { startLivePackageSyncing, initializeLivePackageCra, startLivePackageCra } from "./index";

program
  .command("cra-init")
  .description("initialize live-package in create-react-app project")
  .action(() => {
    initializeLivePackageCra();
  });

program
  .command("sync <packageDistFolder>")
  .description("start syncing files between your app and the package dist folder")
  .action(packageDistFolder => {
    startLivePackageSyncing(packageDistFolder);
  });

program
  .command("cra-start <packageDistFolder>")
  .description(
    "start syncing files and start your create-react-app using rewired, allowing cra to pickup changes to your package"
  )
  .action(packageDistFolder => {
    startLivePackageCra(packageDistFolder);
  });

program.parse(process.argv);

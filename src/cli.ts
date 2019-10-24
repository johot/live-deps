#!/usr/bin/env node
"use strict";
import program from "commander";
import { initializeLivePackageCra } from "./index";
import { version } from "./package.json";

program.version(version);

program
  .command("cra-init")
  .alias("cra")
  .description("initialize live-package in create-react-app project")
  .action(() => {
    initializeLivePackageCra();
  });

program.parse(process.argv);

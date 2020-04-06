#!/usr/bin/env node
"use strict";
import program from "commander";
import { link } from "./main";
import fs from "fs";
import path from "path";

program.version(getLivePackageVersion());

program
  .command("link")
  .description("symlink packages listed in the liveDependencies section of your package.json")
  .action(() => {
    link();
  });

program.parse(process.argv);

export function getLivePackageVersion(): string {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    return packageJson.version;
  } catch (ex) {
    return "??? -> " + ex.toString();
  }
}

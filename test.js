"use strict";

const path = require("path");
const escape = require("escape-string-regexp");

const getAllFiles = require("get-all-files");

const regex = /[a-z]+/;
const testString = "hej";
console.log(regex.test(testString));

console.log(regex);
console.log((regex + "xxx").toString());

const ignoreFileRegex = /^(?!C:\/Users\/otterjo\/Desktop\/nds-consumer\/consumer\/src\/).+\/node_modules\//g;

let allFiles = [];
let nonMatched = [];

let matchedFiles = [];

function ignoredFiles(appSrc) {
  return new RegExp(`^(?!${escape(path.normalize(appSrc + "/").replace(/[\\]+/g, "/"))}).+/node_modules/`, "g");
}

const resolveApp = relativePath => path.resolve(process.cwd(), relativePath);
console.error(resolveApp("src"));
const appSrc = "C:\\Users\\otterjo\\Desktop\\craproj\\src".replace(/\\/g, "/");
const rootDir = "C:\\Users\\otterjo\\Desktop\\craproj".replace(/\\/g, "/");

const calcRegex = ignoredFiles(appSrc);

console.log("calc regex", calcRegex);
console.log("new path", appSrc);

let matching = 0;
let total = 0;

async function main() {
  const files = await getAllFiles(rootDir);

  for (const file of files) {
    const normalized = file.replace(/\\/g, "/");
    //console.log(normalized);
    if (normalized.match(calcRegex)) {
      matching++;
      //console.log("Not ignored", normalized);
      matchedFiles.push(normalized);
    } else {
      nonMatched.push(normalized);
    }

    total++;
  }

  console.log("These files will be ignored:", matchedFiles);
  console.log("Not ignored:", nonMatched);
  console.log("Match count: " + matching);
  console.log("Total count: " + total);
}

main();

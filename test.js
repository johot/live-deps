"use strict";

const path = require("path");
const escape = require("escape-string-regexp");

const getAllFiles = require("get-all-files");

const regex = /[a-z]+/;
const testString = "hej";
console.log(regex.test(testString));

console.log(regex);
console.log((regex + "xxx").toString());

let ignoreFileRegex = /^(?!C:\/Users\/otterjo\/Desktop\/nds-consumer\/consumer\/src\/).+\/node_modules\//g;

const plusVersion = new RegExp(ignoreFileRegex.toString().replace("\\/node_modules\\/", "\\/node_modules\\/(?!johan)"));

console.log(ignoreFileRegex);

console.log(new RegExp(ignoreFileRegex.source.replace("\\/node_modules\\/", "\\/node_modules\\/(?!johan)"), "g"));

let allFiles = [];
let nonMatched = [];

let matchedFiles = [];

function ignoredFiles(appSrc) {
  return new RegExp(`^(?!${escape(path.normalize(appSrc + "/").replace(/[\\]+/g, "/"))}).+/node_modules/`, "g");
}

const resolveApp = relativePath => path.resolve(process.cwd(), relativePath);
console.error(resolveApp("src"));
const appSrc = "C:\\Users\\otterjo\\Desktop\\nds-consumer\\consumer\\src".replace(/\\/g, "/");
const rootDir = "C:\\Users\\otterjo\\Desktop\\nds-consumer\\consumer\\".replace(/\\/g, "/");

//https://stackoverflow.com/questions/49877625/smart-way-to-recompile-create-react-app-when-a-dependency-changes
// ---->
let calcRegex = ignoredFiles(appSrc);
calcRegex = new RegExp(
  calcRegex.source.replace("\\/node_modules\\/", "\\/node_modules\\/(?!" + escape("@nx/nds") + ")"),
  "g"
);
// ---->

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

  //https://stackoverflow.com/questions/49877625/smart-way-to-recompile-create-react-app-when-a-dependency-changes

  console.log("These files will be ignored:", matchedFiles);
  console.log("Not ignored:", nonMatched);
  console.log("Match count: " + matching);
  console.log("Total count: " + total);
}

main();

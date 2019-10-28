import fs from "fs";
import inquirer from "inquirer";
import path from "path";
import npmAddScript from "npm-add-script";

export function getFirstFolderThatExists(folders: string[]) {
  const foundFolder = folders.find(folder => fs.existsSync(folder));
  return foundFolder;
}

export async function getCommandLineAnswer<T = string | boolean>(
  message: string,
  defaultAnswer: T,
  type: "input" | "confirm"
): Promise<T> {
  const answers = await inquirer.prompt([
    {
      type: type,
      name: "question",
      message: message,
      default: defaultAnswer
    }
  ]);

  return answers.question;
}

export function getPackageNameFromPackageFolder(packageDistFolder: string): string {
  const packageJson = JSON.parse(fs.readFileSync(path.join(packageDistFolder, "package.json"), "utf8"));
  const packageName = packageJson.name;
  return packageName;
}

export function getParentDirectory(dir: string) {
  return path.resolve(path.resolve(dir, ".."));
}

export function getLivePackageVersion(): string {
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "package.json"), "utf8"));
    return packageJson.version;
  } catch (ex) {
    return "??? -> " + ex.toString();
  }
}

export function tryAddNpmScriptLine(key: string, value: string) {
  try {
    npmAddScript({ key: key, value: value, force: true });
  } catch (ex) {}
}

export function findNodeModuleFolders(searchDir: string): string[] {
  const results: string[] = [];

  for (const dir of getParentDirectories(searchDir)) {
    const dirWithNodeMules = path.resolve(dir, "node_modules");
    if (fs.existsSync(dirWithNodeMules)) {
      results.push(dirWithNodeMules);
    }
  }

  return results;
}

function getParentDirectories(searchDir: string) {
  const results = [];
  let currentDir = searchDir;
  results.push(path.resolve(currentDir));
  while (true) {
    const parentDir = getParentDirectory(currentDir);
    if (currentDir !== parentDir) {
      results.push(parentDir);

      currentDir = parentDir;
    } else {
      break;
    }
  }

  return results;
}

export function packageJsonContainsDependency(dependencyName: string) {
  const packageJson = JSON.parse(fs.readFileSync("./package.json", "utf8"));
  const dependencies = { ...(packageJson.devDependencies || []), ...(packageJson.dependencies || []) };

  const dep = Object.keys(dependencies).find(k => k.toLowerCase() === dependencyName);
  return dep !== undefined;
}

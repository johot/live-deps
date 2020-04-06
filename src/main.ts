import fs from "fs";
import path from "path";
import { symlinkDir } from "./symlink";

export async function link() {
  // Get config block from package.json
  const packageJson = JSON.parse(fs.readFileSync(path.resolve("./package.json"), "utf8"));
  const liveDependencies = packageJson.liveDependencies ? packageJson.liveDependencies : {};
  const packages = Object.keys(liveDependencies);

  for (const packageName of packages) {
    const packagePath = path.resolve(liveDependencies[packageName]);
    const nodeModulesPackagePath = path.resolve("./node_modules", packageName);

    // Find all the subfolders we need to symlink, skip special folders
    const subFoldersToSymlink = fs
      .readdirSync(packagePath, { withFileTypes: true })
      .filter(
        (dirent) => dirent.isDirectory() && !dirent.name.startsWith(".") && dirent.name.toLowerCase() !== "node_modules"
      )
      .map((dirent) => dirent.name);

    for (const subFolderToSymlink of subFoldersToSymlink) {
      const from = path.resolve(packagePath, subFolderToSymlink);
      const to = path.join(nodeModulesPackagePath, subFolderToSymlink);
      await symlinkDir(from, to);
      //console.log(chalk.magentaBright("Live package symlinked:", from, "to", to));
    }
  }
}

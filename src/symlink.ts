import symLinkDirLib from "symlink-dir";
import chalk from "chalk";
import fs from "fs";
import path from "path";

export function symlinkDir(src: string, dest: string): Promise<{ reused: Boolean; warn?: string }> {
  console.log(chalk.magentaBright(`live-deps symlinking: ${chalk.yellow(src)} to folder: ${chalk.yellow(dest)}`));
  return symLinkDirLib(src, dest);
}

export function tryUnsymlinkDir(dest: string) {
  if (fs.existsSync(dest) && fs.lstatSync(dest).isSymbolicLink()) {
    // Delete symlink
    fs.unlinkSync(dest);

    // Restore previous if it exists
    const dirBackup = path.resolve(dest, "..", ".ignored_" + path.basename(dest));
    console.log(chalk.magentaBright(`live-deps removed symlink: ${chalk.yellow(dest)}`));

    if (fs.existsSync(dirBackup)) {
      fs.renameSync(dirBackup, dest);
      console.log(chalk.magentaBright(`live-deps restored previous folder: ${chalk.yellow(dest)}`));
    }
  }
}

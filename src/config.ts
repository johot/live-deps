import fs from "fs";

export interface LivePackageConfig {
  packageConfigs: PackageConfig[];
}

export interface PackageConfig {
  packageFolder: string;
  fallbackFolders?: string[];
  syncDependencies?: string[];
  projectStartScript?: string;
  packageBuildScript?: string;
}

export function getLivePackageConfig(): LivePackageConfig {
  const data = fs.readFileSync("live-package.json", "utf8");
  return JSON.parse(data) as LivePackageConfig;
}

export function createLivePackageConfigFile(packageFolder: string, runPackageScript: string): string {
  const config: LivePackageConfig = {
    packageConfigs: [
      {
        packageFolder: packageFolder,
        syncDependencies: [],
        projectStartScript: "start",
        packageBuildScript: runPackageScript
      }
    ]
  };

  return JSON.stringify(config, undefined, 2);
}

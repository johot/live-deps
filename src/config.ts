import fs from "fs";

export interface LivePackageConfig {
  packageConfigs: PackageConfig[];
  sharedDependencies: SharedDependency[];
}

export interface SharedDependency {
  name: string;
  source?: "app" | "package"; // TODO, default to "app"
}

export interface PackageConfig {
  packageFolder: string | string[];
  projectStartScript?: string;
  packageBuildScript?: string;
}

export function getLivePackageConfig(): LivePackageConfig {
  const data = fs.readFileSync("live-package.json", "utf8");
  return JSON.parse(data) as LivePackageConfig;
}

export function createLivePackageConfigFile(
  packageFolder: string,
  runPackageScript: string,
  sharedDependencies: string[]
): string {
  const config: LivePackageConfig = {
    packageConfigs: [
      {
        packageFolder: packageFolder,
        projectStartScript: "start",
        packageBuildScript: runPackageScript
      }
    ],
    sharedDependencies: sharedDependencies.map(dep => {
      return { name: dep, source: "app" } as SharedDependency;
    })
  };

  return JSON.stringify(config, undefined, 2);
}

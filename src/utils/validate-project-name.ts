type ValidationResult =
  | {
      valid: true;
    }
  | {
      message: string;
      valid: false;
    };

const packageNamePattern = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/;

const reservedNames = new Set(["node_modules", "favicon.ico"]);

export const createPackageName = (projectName: string): string =>
  projectName
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, "-")
    .replaceAll(/[^a-z0-9._/-]/g, "-");

export const validateProjectName = (projectName: string): ValidationResult => {
  const packageName = createPackageName(projectName);

  if (!packageName) {
    return { message: "Project name is required.", valid: false };
  }

  if (reservedNames.has(packageName)) {
    return { message: `"${packageName}" is reserved.`, valid: false };
  }

  if (!packageNamePattern.test(packageName)) {
    return {
      message:
        "Project name must be a valid npm package name using lowercase letters, numbers, dashes, underscores, or dots.",
      valid: false,
    };
  }

  return { valid: true };
};

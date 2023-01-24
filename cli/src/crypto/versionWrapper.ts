function getFormattedVersionNumber(version: number) {
  let versionNumberString = (version - 1).toString(10);
  while (versionNumberString.length < 3) {
    versionNumberString = `0${versionNumberString}`;
  }
  return versionNumberString;
}

export function appendVersion(string: string, version: number): string {
  return `${getFormattedVersionNumber(version)}.${string}`;
}

export function parseStringWithVersion(b64: string): {
  version: number;
  data: string;
} {
  const [version, ...data] = b64.split(".");
  if (!version || !data) {
    throw new Error("Provided string does not contain a version");
  }
  const versionNumber = parseInt(version, 10);

  if (isNaN(versionNumber))
    throw new Error("Invalid version in a provided string");
  return { version: versionNumber, data: data.join(".") };
}

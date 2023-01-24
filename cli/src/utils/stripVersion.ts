export default function stripVersion(stringWithVersion: string): string {
  const [version, ...rest] = stringWithVersion.split(".");
  if (rest.length === 0) {
    return version;
  }
  return rest.join(".");
}

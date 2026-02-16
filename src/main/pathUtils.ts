import * as os from 'os'

const homedir = os.homedir()

/**
 * Robustly resolves a file path, handling the tilde (~) to represent the home directory.
 * It only replaces the tilde if it's at the start of the path and followed by a
 * path separator or the end of the string.
 * @param filePath The path to resolve.
 * @returns The resolved path.
 */
export const resolvePath = (filePath: string): string => {
  if (typeof filePath !== 'string') {
    return ''
  }
  // The regex ^~(?=$|\/|\\) matches ~ at the start of the string,
  // followed by the end of the string ($), a forward slash (/), or a backward slash (\).
  return filePath.replace(/^~(?=$|\/|\\)/, homedir)
}

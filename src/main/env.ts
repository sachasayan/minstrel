import { existsSync } from 'fs'
import { join } from 'path'
import dotenv from 'dotenv'

let loaded = false

export const loadMainEnv = () => {
  if (loaded) return
  loaded = true

  const cwdEnvPath = join(process.cwd(), '.env')
  if (existsSync(cwdEnvPath)) {
    dotenv.config({ path: cwdEnvPath })
    return
  }

  dotenv.config()
}

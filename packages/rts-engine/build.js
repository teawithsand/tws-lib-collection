import { cpSync, mkdirSync, readdirSync } from 'fs'
import { join } from 'path'

const pkgDir = './pkg'
const distDir = './dist'

mkdirSync(distDir, { recursive: true })

const files = readdirSync(pkgDir)

for (const file of files) {
    if (file === 'package.json' || /^\.git/.test(file)) continue
    cpSync(join(pkgDir, file), join(distDir, file), { recursive: true })
}

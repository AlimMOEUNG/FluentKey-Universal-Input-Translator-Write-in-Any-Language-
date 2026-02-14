import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const TARGET_BROWSER = 'edge'
const OUT_DIR = 'dist-edge'
const distPath = path.join(__dirname, '..', OUT_DIR)
const outputDir = path.join(__dirname, '../')
// Edge uses the same manifest as Chrome
const manifestPath = path.join(__dirname, '../manifests/manifest.chrome.json')
const packageJsonPath = path.join(__dirname, '../package.json')

// Check if we're building in dev mode (from package.json script)
const isDevMode = process.argv.includes('--dev')
const buildMode = isDevMode ? 'development' : 'production'

console.log(`🔨 Building Edge extension (${buildMode} mode)...`)

try {
  // Run Vite build with environment variables
  const buildCommand = isDevMode
    ? `TARGET_BROWSER=${TARGET_BROWSER} OUT_DIR=${OUT_DIR} vite build --mode development`
    : `TARGET_BROWSER=${TARGET_BROWSER} OUT_DIR=${OUT_DIR} vite build --mode production`

  execSync(buildCommand, {
    cwd: path.join(__dirname, '..'),
    stdio: 'inherit',
    env: {
      ...process.env,
      TARGET_BROWSER,
      OUT_DIR
    }
  })

  console.log('\n✅ Edge build completed!')

  // Read version from manifest and sync package.json
  let version = '1.0.0'
  try {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    version = manifest.version || version

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
      if (packageJson.version !== version) {
        packageJson.version = version
        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n')
        console.log(`✅ Synchronized package.json version to manifest: ${version}`)
      }
    }
  } catch {
    console.warn('⚠️ Could not read manifest version, using default 1.0.0')
  }

  // Only create ZIP in production mode
  if (!isDevMode) {
    // Delete old Edge zips
    const zipPattern = /^powerInput-edge-v.*\.zip$/
    fs.readdirSync(outputDir)
      .filter((file) => zipPattern.test(file))
      .forEach((file) => {
        try {
          fs.unlinkSync(path.join(outputDir, file))
          console.log(`🗑️ Deleted old zip: ${file}`)
        } catch (e) {
          console.warn(`⚠️ Could not delete ${file}:`, e)
        }
      })

    // Create new zip
    const zipName = `powerInput-edge-v${version}.zip`
    const zipPath = path.join(outputDir, zipName)

    console.log(`\n📦 Creating ${zipName}...`)

    execSync(`zip -r "${zipPath}" .`, { cwd: distPath, stdio: 'inherit' })

    console.log(`\n✅ Created ${zipName} successfully!`)
    console.log(`📂 Build output: ${OUT_DIR}/`)
    console.log(`📦 ZIP file: ${zipName}`)
    console.log(`\n🚀 Ready to upload to Microsoft Edge Add-ons!`)
  } else {
    console.log(`\n✅ Development build completed!`)
    console.log(`📂 Build output: ${OUT_DIR}/`)
    console.log(`💡 Load unpacked extension from ${OUT_DIR}/ in Edge`)
  }

} catch (e) {
  console.error('❌ Error building Edge extension:', e)
  process.exit(1)
}

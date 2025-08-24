import { build, context } from 'esbuild'
import { rmSync, mkdirSync, readFileSync, writeFileSync, copyFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const root = resolve(__dirname, '..')
const outdir = resolve(root, 'dist')

function ensureDir(dir) {
	try { mkdirSync(dir, { recursive: true }) } catch {}
}

function clean() {
	try { rmSync(outdir, { recursive: true, force: true }) } catch {}
}

function copyStatic() {
	const manifestSrc = resolve(root, 'manifest.json')
	const packageSrc = resolve(root, 'package.json')
	const readmeSrc = resolve(root, 'README.md')
	const licenseSrc = resolve(root, 'LICENSE')
	const iconSrc = resolve(root, 'icon.svg')
	const manifestDst = resolve(outdir, 'manifest.json')
	ensureDir(outdir)
	copyFileSync(manifestSrc, manifestDst)
	try { copyFileSync(packageSrc, resolve(outdir, 'package.json')) } catch {}
	try { copyFileSync(readmeSrc, resolve(outdir, 'README.md')) } catch {}
	try { copyFileSync(licenseSrc, resolve(outdir, 'LICENSE')) } catch {}
	try { copyFileSync(iconSrc, resolve(outdir, 'icon.svg')) } catch {}
}

async function run({ watch } = { watch: false }) {
	clean()
	copyStatic()

	const common = {
		bundle: true,
		platform: 'browser',
		target: ['es2020'],
		outdir,
		sourcemap: true,
		logLevel: 'info',
		external: [],
	}

	const entryPoints = [
		resolve(root, 'src', 'index.ts')
	]

	if (watch) {
		const ctx = await context({ ...common, entryPoints })
		await ctx.watch()
		console.log('Watching...')
	} else {
		await build({ ...common, entryPoints })
	}
}

const watch = process.argv.includes('--watch')
run({ watch })



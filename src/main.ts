import './style.css'
import { WebGPURenderer } from 'three/webgpu'
import GUI from 'lil-gui'
import { VolumeViewer } from './VolumeViewer'

const query = new URLSearchParams(location.search)
// Which file in public/ to render, e.g. http://localhost:5173/?volume=volume.nrrd
const volumeUrl = query.get('volume') ?? 'cube.nrrd'
// Add ?webgl to force the WebGL2 backend (same TSL shader, compiled to GLSL).
const forceWebGL = query.has('webgl')

const status = document.querySelector<HTMLDivElement>('#status')!
const canvas = document.querySelector<HTMLCanvasElement>('canvas.webgl')!

// WebGPURenderer uses WebGPU when the browser has it and falls back to WebGL2 otherwise.
const renderer = new WebGPURenderer({ canvas, antialias: true, forceWebGL })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
renderer.setSize(innerWidth, innerHeight)
renderer.setClearColor(0x000000, 1)
await renderer.init()

const backend = (renderer.backend as { isWebGPUBackend?: boolean }).isWebGPUBackend ? 'WebGPU' : 'WebGL2'

const viewer = new VolumeViewer(renderer)

const gui = new GUI({ title: `Volume · ${backend}` })
gui.add(viewer.params, 'colorful').name('color').onChange(viewer.render)
gui.add(viewer.params, 'volume').name('volume').onChange(viewer.render)
gui.add(viewer.params, 'min', 0, 1, 0.01).name('min').onChange(viewer.render)
gui.add(viewer.params, 'max', 0, 1, 0.01).name('max').onChange(viewer.render)

status.textContent = `Loading ${volumeUrl}…`
try {
  await viewer.load(volumeUrl)
  status.hidden = true
} catch (err) {
  status.textContent = `Failed to load ${volumeUrl} (is it in public/?): ${(err as Error).message}`
  console.error(err)
}

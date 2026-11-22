import {
  BoxGeometry,
  Data3DTexture,
  Mesh,
  NearestFilter,
  PerspectiveCamera,
  RedFormat,
  Scene,
  SRGBColorSpace,
  TextureLoader,
  UnsignedByteType,
  type WebGPURenderer,
} from 'three/webgpu'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { NRRDLoader } from 'three/addons/loaders/NRRDLoader.js'
import { createVolumeMaterial } from './volumeMaterial'
import viridisUrl from './textures/cm_viridis.png'

export interface ViewerParams {
  /** Viridis colormap (true) or grayscale (false). */
  colorful: boolean
  /** Maximum intensity projection (true) or box surface only (false). */
  volume: boolean
  /** Display window, normalized intensity in [0, 1]. */
  min: number
  max: number
}

export class VolumeViewer {
  readonly params: ViewerParams = { colorful: true, volume: true, min: 0, max: 1 }

  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(75, innerWidth / innerHeight, 0.01, 5)
  private readonly controls: OrbitControls
  private volumeMaterial?: ReturnType<typeof createVolumeMaterial>

  constructor(private readonly renderer: WebGPURenderer) {
    this.camera.position.set(0, 0, -1.5)
    this.camera.up.set(0, -1, 0)

    this.controls = new OrbitControls(this.camera, renderer.domElement)
    this.controls.addEventListener('change', this.render)

    addEventListener('resize', this.onResize)
  }

  /** Load a uint8 NRRD volume and add it to the scene as a ray-marched box. */
  async load(url: string) {
    const [volume, colormap] = await Promise.all([
      new NRRDLoader().loadAsync(url),
      new TextureLoader().loadAsync(viridisUrl),
    ])

    if (!(volume.data instanceof Uint8Array)) {
      throw new Error(`${url}: expected uint8 voxels, got ${volume.data.constructor.name}`)
    }

    const { xLength: w, yLength: h, zLength: d } = volume

    const volumeTex = new Data3DTexture(volume.data, w, h, d)
    volumeTex.format = RedFormat
    volumeTex.type = UnsignedByteType
    volumeTex.minFilter = NearestFilter
    volumeTex.magFilter = NearestFilter
    volumeTex.unpackAlignment = 1
    volumeTex.needsUpdate = true

    colormap.colorSpace = SRGBColorSpace
    colormap.minFilter = NearestFilter
    colormap.magFilter = NearestFilter

    this.volumeMaterial = createVolumeMaterial(volumeTex, colormap)

    // Unit box scaled to the volume's aspect ratio; the longest side is 1.
    const box = new Mesh(new BoxGeometry(1, 1, 1), this.volumeMaterial.material)
    const s = 1 / Math.max(w, h, d)
    box.scale.set(w * s, h * s, d * s)
    this.scene.add(box)

    this.render()
  }

  /** Render one frame. Rendering is on demand: call this after changing params. */
  render = () => {
    if (this.volumeMaterial) {
      const { uniforms } = this.volumeMaterial
      uniforms.colorful.value = this.params.colorful ? 1 : 0
      uniforms.mip.value = this.params.volume ? 1 : 0
      uniforms.clim.value.set(this.params.min, this.params.max)
    }

    this.renderer.render(this.scene, this.camera)
  }

  private onResize = () => {
    this.camera.aspect = innerWidth / innerHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(innerWidth, innerHeight)
    this.render()
  }
}

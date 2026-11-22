import { BackSide, NodeMaterial, Vector2, Vector3, type Data3DTexture, type Node, type Texture } from 'three/webgpu'
import {
  Fn,
  If,
  Loop,
  Discard,
  float,
  int,
  vec2,
  vec3,
  vec4,
  min,
  max,
  ceil,
  clamp,
  select,
  texture,
  texture3D,
  uniform,
  varying,
  cameraPosition,
  modelWorldMatrixInverse,
  positionGeometry,
  sRGBTransferEOTF,
} from 'three/tsl'

/** Upper bound on samples per ray. A 2048³ volume has a diagonal of ~3547 voxels. */
const MAX_STEPS = 4096

/**
 * Ray-box intersection against the unit cube [-0.5, 0.5]³ (slab method).
 * Returns (tNear, tFar) along the ray.
 */
const hitBox = Fn(([origin, dir]: [Node<'vec3'>, Node<'vec3'>]) => {
  const invDir = dir.reciprocal()
  const t0 = vec3(-0.5).sub(origin).mul(invDir)
  const t1 = vec3(0.5).sub(origin).mul(invDir)
  const tmin = min(t0, t1)
  const tmax = max(t0, t1)
  return vec2(max(tmin.x, tmin.y, tmin.z), min(tmax.x, tmax.y, tmax.z))
})

/**
 * Volume material written in TSL.
 *
 * It is applied to a unit box (BackSide) whose scale matches the volume's aspect ratio.
 * Every fragment casts a ray from the camera through the box in object space, so the
 * box's model matrix does all the coordinate bookkeeping — no hand-built inverse matrices.
 *
 * TSL compiles to WGSL on WebGPU and to GLSL on the WebGL2 fallback.
 */
export function createVolumeMaterial(volumeTex: Data3DTexture, colormapTex: Texture) {
  const uniforms = {
    /** Display window (min, max) on normalized intensity [0, 1]. */
    clim: uniform(new Vector2(0, 1)),
    /** Volume size in voxels (w, h, d). */
    size: uniform(new Vector3(volumeTex.image.width, volumeTex.image.height, volumeTex.image.depth)),
    /** 1 = viridis colormap, 0 = grayscale. */
    colorful: uniform(1),
    /** 1 = maximum intensity projection through the volume, 0 = sample the box surface only. */
    mip: uniform(1),
  }

  const volume = texture3D(volumeTex)
  const colormap = texture(colormapTex)

  // Camera position and view ray in the box's object space, where the box is [-0.5, 0.5]³.
  const rayOrigin = varying(modelWorldMatrixInverse.mul(vec4(cameraPosition, 1)).xyz)
  const rayDirection = varying(positionGeometry.sub(rayOrigin))

  // Texture fetches use an explicit LOD (level 0): they run inside a data-dependent loop,
  // where WGSL forbids implicit-derivative sampling.
  const sampleVolume = (uvw: Node<'vec3'>) => volume.sample(uvw).level(float(0)).r

  const fragment = Fn(() => {
    const dir = rayDirection.normalize()
    const bounds = hitBox(rayOrigin, dir)
    const tNear = max(bounds.x, 0) // camera may be inside the box
    const tFar = bounds.y

    If(tNear.greaterThanEqual(tFar), () => {
      Discard()
    })

    // Entry / exit points in texture space [0, 1]³.
    const entry = rayOrigin.add(dir.mul(tNear)).add(0.5).toVar()
    const exit = rayOrigin.add(dir.mul(tFar)).add(0.5)

    const value = float(0).toVar()

    If(uniforms.mip.greaterThan(0.5), () => {
      // About one sample per voxel along the ray: the chord length measured in voxels.
      const chord = exit.sub(entry).toVar()
      const steps = int(clamp(ceil(chord.mul(uniforms.size).length()), 1, MAX_STEPS)).toVar()
      const stepVec = chord.div(float(steps)).toVar()

      // Maximum intensity projection over the voxels inside the min–max window, so lowering
      // max reveals what is hidden behind bright voxels. -1 means "none found" → transparent.
      const maxVal = float(-1).toVar()

      Loop({ start: int(0), end: steps, type: 'int', condition: '<' }, ({ i }) => {
        const v = sampleVolume(entry.add(stepVec.mul(float(i).add(0.5))))
        const inWindow = v.greaterThan(uniforms.clim.x).and(v.lessThanEqual(uniforms.clim.y))
        If(inWindow.and(v.greaterThan(maxVal)), () => {
          maxVal.assign(v)
        })
      })

      value.assign(maxVal)
    }).Else(() => {
      // Surface mode: the voxel where the ray enters the box.
      value.assign(sampleVolume(entry))
    })

    // Map through the display window; anything outside it is transparent.
    const range = max(uniforms.clim.y.sub(uniforms.clim.x), 1e-6)
    const t = value.sub(uniforms.clim.x).div(range).toVar()

    If(t.lessThan(0.001).or(t.greaterThan(1)), () => {
      Discard()
    })

    // The colormap PNG is tagged sRGB, so sampling returns linear values. For grayscale,
    // decode t from sRGB so the final sRGB output shows the raw value t on screen.
    const viridis = colormap.sample(vec2(t, 0.5)).level(float(0)).rgb
    const gray = sRGBTransferEOTF(vec3(t)) as Node<'vec3'> // @types/three types this loosely
    const rgb = select(uniforms.colorful.greaterThan(0.5), viridis, gray)

    return vec4(rgb, 1)
  })

  const material = new NodeMaterial()
  material.side = BackSide
  material.fragmentNode = fragment()

  return { material, uniforms }
}

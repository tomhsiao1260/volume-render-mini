# Introduction

Minimum version of volume rendering. You can use it as a template and build stuff on top of it.

> **This is the WebGPU + TSL version (`dev` branch).**
> It is a rewrite of the original WebGL / GLSL template on `main`, using current three.js practice:
>
> - **`WebGPURenderer`** (three.js r187, `three/webgpu`). It runs on WebGPU and falls back to WebGL2 automatically when the browser has no WebGPU.
> - **TSL (Three Shading Language)** (`three/tsl`) instead of a hand-written GLSL string. The ray marcher is written in TypeScript and compiled to WGSL (WebGPU) or GLSL (WebGL2) from the same source.
> - **TypeScript + Vite 8**, ES modules, top-level `await`, `lil-gui` from npm.
> - **Ray casting through a box mesh** (`BackSide`) instead of a full-screen quad with hand-built inverse matrices. The mesh's model matrix handles the volume's position and aspect ratio.
>
> The original GLSL version is still on the `main` branch.

## Run the app

Install javascript packages

```bash
npm install
```

Run the app

```bash
npm run dev
```

Other scripts: `npm run build` (type check + production build), `npm run typecheck`.

URL options:

| Query           | Effect                                                         |
| --------------- | -------------------------------------------------------------- |
| `?volume=x.nrrd` | render `public/x.nrrd` instead of `cube.nrrd`                 |
| `?webgl`        | force the WebGL2 backend (same TSL shader, compiled to GLSL)   |

The panel title shows which backend is running (`Volume · WebGPU` or `Volume · WebGL2`).

## Render your own data

If you successfully run the app, you will see the rendering result of `cube.nrrd` which is generated from `cube.py` as a quick demo. Now, let's render your own data.

Install python packages

```bash
pip install -r requirements.txt
```

Generate `.nrrd` from `.tif` files.

```bash
python volume.py <INPUT_FOLDER> <OUTPUT_FOLDER> --start_coord 0 0 0 --chunk_size 128 128 128
```

`INPUT_FOLDER` folder with lots of tifs (e.g. 000.tif, 001.tif, ..., 127.tif)

`OUTPUT_FOLDER` use `public` folder to save the result

`--start_coord` the starting position (x, y, z)

`--chunk_size` volume size (x, y, z)

`--png` flag if you want to use `.png` instead of `.tif`

Then open the app with `?volume=volume.nrrd` (e.g. `http://localhost:5173/?volume=volume.nrrd`), hopefully you can see the result, cheer! The viewer expects 8-bit (`uint8`) voxels, which is what `volume.py` writes.

## Project structure

```
index.html
src/
  main.ts             renderer + GUI setup
  VolumeViewer.ts     scene, camera, controls, NRRD loading, on-demand rendering
  volumeMaterial.ts   the TSL ray marcher (MIP / surface, colormap, display window)
  textures/cm_viridis.png
public/
  cube.nrrd, cube.py  demo volume
volume.py             tif/png stack → .nrrd
```

## How it works

The volume is uploaded as an 8-bit `Data3DTexture` and drawn as a unit box scaled to the volume's aspect ratio. For every pixel on the box, the TSL fragment shader in `src/volumeMaterial.ts`:

1. casts a ray from the camera in the box's object space and intersects it with `[-0.5, 0.5]³`,
2. in **volume** mode, takes about one sample per voxel along the ray and keeps the brightest voxel inside the `min`–`max` window (maximum intensity projection); otherwise it samples the voxel where the ray enters the box,
3. maps the value through the `min`–`max` window to the viridis colormap or grayscale. Values outside the window are transparent.

The scene only re-renders when the camera or a GUI value changes.

## Differences from the `main` (GLSL) version

- Non-cubic volumes are sampled correctly. On `main`, the step length mixed world and texture units, so rays stopped short or overshot when the volume was not a cube.
- MIP skips voxels above `max` as well as below `min`, so lowering `max` reveals what is behind bright voxels. On `main`, a ray that crossed any voxel above `max` disappeared entirely.
- Values outside the `min`–`max` window are now really transparent. On `main` the shader wrote alpha 0 but the canvas still showed the color (dark purple in viridis mode).
- There is no fixed `MAX_STEPS` to edit per volume size; the step count follows the ray length in voxels (capped at 4096).

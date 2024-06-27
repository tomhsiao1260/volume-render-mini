# Introduction

Minimum version of volume rendering. You can use it as a templete and build stuff on top of it.

## Run the app

Install javascript packages

```bash
npm install
```

Run the app

```bash
npm run dev
```

## Render your own data

If you sucessfully run the app, you will see the rendering result of `cube.nrrd` which is generated from `cube.py` as a quick demo. Now, let's render your own data.

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

In `ViewerCore.js`, rename `cube.nrrd` to you own data `volume.nrrd` and run the app again, hopefully you can see the result, cheer!



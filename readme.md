# Introduction

Minimum version of volume rendering. You can use it as a templete and build stuff on top of it.

# How to run

Install python packages

```bash
pip install -r requirements.txt
```
 
Generate `.nrrd` from `.tif` files.

`--start_coord` is the starting position (x, y, z)
`--chunk_size` is volume size (x, y, z)
`--png` flag if you want to use `.png` instead of `.tif`.

```bash
python volume.py <INPUT_FOLDER> <OUTPUT_FOLDER> --start_coord 0 0 0 --chunk_size 128 128 128
```

Install javascript packages

```bash
npm install
```

Run the app

```bash
npm run dev
```


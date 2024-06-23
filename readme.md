# Introduction

Minimum version of volume rendering. You can use it as a templete and build stuff on top of it.

# How to run

Install python packages

```bash
pip install -r requirements.txt
```
 
Generate `.nrrd` from `.tif` files

```bash
python volume.py <TIFF_FOLDER> <OUTPUT_FOLDER> --chunk_size 128 128 128 --start_coord 0 0 0
```

Install javascript packages

```bash
npm install
```

Run the app

```bash
npm run dev
```


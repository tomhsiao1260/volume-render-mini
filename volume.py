# modify from here: https://github.com/KhartesViewer/scroll2zarr

import os
import re
import sys
import nrrd
import argparse
import tifffile
import numpy as np
from pathlib import Path

def tifs2nrrd(tiffdir, nrrddir, chunk_size, start_coord):
    # Note this is a generator, not a list
    tiffs = tiffdir.glob("*.tif")
    rec = re.compile(r'([0-9]+)\.\w+$')

    inttiffs = {}
    for tiff in tiffs:
        tname = tiff.name
        match = rec.match(tname)
        if match is None:
            continue
        # Look for last match (closest to end of file name)
        # ds = match[-1]
        ds = match.group(1)
        itiff = int(ds)
        if itiff in inttiffs:
            err = "File %s: tiff id %d already used"%(tname,itiff)
            print(err)
            return err
        inttiffs[itiff] = tiff
    if len(inttiffs) == 0:
        err = "No tiffs found"
        print(err)
        return err

    itiffs = list(inttiffs.keys())
    itiffs.sort()

    minz = itiffs[0]
    maxz = itiffs[-1]

    tiff0 = tifffile.imread(inttiffs[minz])
    h, w = tiff0.shape

    x0, y0, z0 = start_coord
    cx, cy, cz = chunk_size

    stack = np.zeros((cz, cy, cx), dtype=np.uint8)

    for layer in range(z0, z0+cz, 1):
        index = itiffs[layer]
        tiff = tifffile.imread(inttiffs[index])

        stack[layer, :, :] = tiff[y0:y0+cy, x0:x0+cx]

    # debug
    filename = os.path.join(nrrddir, 'volume.tif')
    tifffile.imwrite(filename, stack)

    # nrrd for rendering
    filename = os.path.join(nrrddir, 'volume.nrrd')
    nrrd.write(filename, stack)

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
            "input_tiff_dir", 
            help="Directory containing tiff files")
    parser.add_argument(
            "output_nrrd_dir", 
            help="Name of directory that will contain nrrd file")
    parser.add_argument(
            "--chunk_size", 
            nargs=3,
            type=int,
            default=[128, 128, 128],
            help="Size of chunk (x, y, z)")
    parser.add_argument(
            "--start_coord", 
            nargs=3,
            type=int,
            default=[0, 0, 0],
            help="Starting coordinate (x, y, z)")

    args = parser.parse_args()

    # validate input_tiff_dir
    tiffdir = Path(args.input_tiff_dir)
    if not tiffdir.exists():
        print("Input TIFF directory", tiffdir, "does not exist")
        return 1

    # validate output_nrrd_dir
    nrrddir = Path(args.output_nrrd_dir)
    if not nrrddir.exists(): os.mkdir(nrrddir)

    # validate chunk_size
    chunk_size = args.chunk_size
    if any(size <= 0 for size in chunk_size):
        print("Invalid chunk size", chunk_size)
        return 1

    # validate start_coord 
    start_coord = args.start_coord
    if any(p < 0 for p in start_coord):
        print("Invalid starting coordinate", start_coord)
        return 1

    tifs2nrrd(tiffdir, nrrddir, chunk_size, start_coord)

if __name__ == '__main__':
    sys.exit(main())
import os
import sys
import argparse
from pathlib import Path

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

    args = parser.parse_args()

    # validate input_tiff_dir
    tiffdir = Path(args.input_tiff_dir)
    if not tiffdir.exists():
        print("Input TIFF directory",tiffdir,"does not exist")
        return 1

    # validate output_nrrd_dir
    nrrddir = Path(args.output_nrrd_dir)
    if not nrrddir.exists(): os.mkdir(nrrddir)

    # validate chunk_size
    chunk_size = args.chunk_size
    if any(size <= 0 for size in chunk_size):
        print("Invalid chunk size", chunk_size, ". All dimensions must be positive integers.")
        return 1

if __name__ == '__main__':
    sys.exit(main())
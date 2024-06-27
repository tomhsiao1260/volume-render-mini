import nrrd
import tifffile
import numpy as np

z, y, x = 2, 3, 5
# z, y, x = 500, 150, 300

cube = np.zeros((z, y, x), dtype=np.uint8)

for i in range(z):
    for j in range(y):
        for k in range(x):
            cube[i, j, k] = int(255 * (i+k+j) / (x+y+z-3))

tifffile.imwrite('cube.png', cube.transpose(0, 1, 2))
nrrd.write('cube.nrrd', cube.transpose(2, 1, 0))
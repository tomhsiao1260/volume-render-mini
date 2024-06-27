import nrrd
import tifffile
import numpy as np

z = 2
y = 3
x = 5

cube = np.zeros((z, y, x), dtype=np.uint8)

for i in range(z):
    for j in range(y):
        for k in range(x):
            cube[i, j, k] = int(255 * (i+k+j) / (x+y+z-3))

tifffile.imwrite('cube.png', cube.transpose(0, 1, 2))
nrrd.write('cube.nrrd', cube.transpose(2, 1, 0))
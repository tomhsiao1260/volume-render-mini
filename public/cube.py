import nrrd
import tifffile
import numpy as np

z, y, x = 2, 3, 5
# z, y, x = 500, 150, 300

i = np.arange(z)[:, None, None]
j = np.arange(y)[None, :, None]
k = np.arange(x)[None, None, :]

# z, y, x
cube = (255 * (i + j + k) / (x + y + z - 3)).astype(np.uint8)

# z, y, x
tifffile.imwrite('cube.png', cube.transpose(0, 1, 2))
# x, y, z
nrrd.write('cube.nrrd', cube.transpose(2, 1, 0))
import * as THREE from "three";
import { useState, useEffect, useRef } from "react";
import { useFrame, extend, invalidate } from "@react-three/fiber";
import { shaderMaterial } from "@react-three/drei";
import { NRRDLoader } from "three/examples/jsm/loaders/NRRDLoader";
import textureViridis from "./textures/cm_viridis.png";
import volumeFragment from "./volume.glsl";
import { useControls } from "leva";

const FullScreenMaterial = shaderMaterial(
  {
    cmdata: null,
    volumeTex: null,
    volume: true,
    colorful: true,
    size: new THREE.Vector3(),
    clim: new THREE.Vector2(0.4, 1.0),
    projectionInverse: new THREE.Matrix4(),
    transformInverse: new THREE.Matrix4(),
  },
  `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
  `,
  volumeFragment
);
extend({ FullScreenMaterial });

export default function Volume() {
  const fullScreenMaterialRef = useRef();

  const [loaded, setLoaded] = useState(false);
  const [inverseBoundsMatrix, setInverseBoundsMatrix] = useState(null);

  const [colorful, setColorful] = useState(true);
  const [volume, setVolume] = useState(true);
  const [clim, setClim] = useState(new THREE.Vector2(0, 1));

  useControls(() => ({
    colorful: {
      value: colorful,
      onChange: setColorful,
    },
    volume: {
      value: colorful,
      onChange: setVolume,
    },
    threshold: {
      min: clim.x,
      max: clim.y,
      value: clim.toArray(),
      onChange: (v) => {
        setClim(new THREE.Vector2(v[0], v[1]));
      },
    },
  }));

  useEffect(() => {
    if (!loaded) {
      process();
    }

    async function process() {
      const volume = await new NRRDLoader().loadAsync("cube.nrrd");
      const { xLength: w, yLength: h, zLength: d } = volume;
      console.log("volume loading ...");

      const matrix = new THREE.Matrix4();
      const center = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scaling = new THREE.Vector3();
      const s = 1 / Math.max(w, h, d);

      const inverseBoundsMatrix = new THREE.Matrix4();
      scaling.set(w * s, h * s, d * s);
      matrix.compose(center, quat, scaling);
      inverseBoundsMatrix.copy(matrix).invert();
      setInverseBoundsMatrix(inverseBoundsMatrix);

      const volumeTex = new THREE.Data3DTexture(volume.data, w, h, d);
      volumeTex.format = THREE.RedFormat;
      volumeTex.type = THREE.UnsignedByteType;
      volumeTex.minFilter = THREE.NearestFilter;
      volumeTex.magFilter = THREE.NearestFilter;
      volumeTex.needsUpdate = true;

      fullScreenMaterialRef.current.size.set(w, h, d);
      fullScreenMaterialRef.current.volumeTex = volumeTex;

      const cmtextures = {
        viridis: new THREE.TextureLoader().load(textureViridis),
      };
      fullScreenMaterialRef.current.cmdata = cmtextures.viridis;

      setLoaded(true);

      setTimeout(() => {
        invalidate();
      }, 500);
    }
  }, [loaded]);

  useFrame((state, delta) => {
    if (!loaded) return;

    console.log("rendering ...");

    state.camera.updateMatrixWorld();

    fullScreenMaterialRef.current.projectionInverse.copy(
      state.camera.projectionMatrixInverse
    );

    fullScreenMaterialRef.current.transformInverse
      .copy(new THREE.Matrix4())
      .invert()
      .premultiply(inverseBoundsMatrix)
      .multiply(state.camera.matrixWorld);
  });

  return (
    <mesh>
      <planeGeometry args={[2, 2, 1, 1]} />
      <fullScreenMaterial
        ref={fullScreenMaterialRef}
        colorful={colorful}
        volume={volume}
        clim={clim}
      />
    </mesh>
  );
}

import * as THREE from 'three'
import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber'
import { OrbitControls, shaderMaterial } from '@react-three/drei'

export default function App()
{
  const gl = {}
  gl.antialias = true
  gl.outputEncoding = THREE.sRGBEncoding 

  const camera = {}
  camera.fov = 75
  camera.far = 50
  camera.near = 0.01
  camera.up = [ 0, -1, 0 ]
  camera.position = [ 0, 0, -1.5 ]

  return <>
    <Canvas
      frameloop="demand"
      camera={ camera }
      gl={ gl }
    >
      <OrbitControls enableDamping={ false } makeDefault />

      <Volume />
      {/*<Cube />*/}
    </Canvas>
  </>
}

export function Cube()
{
  useFrame((state, delta) =>
  {
    console.log('tick')
  })

  return <mesh>
    <boxGeometry args={[ 1, 1, 1 ]}/>
    <meshNormalMaterial />
  </mesh>
}

const FullScreenMaterial = shaderMaterial(
  {
    size: new THREE.Vector3(),
    projectionInverse: new THREE.Matrix4(),
    sdfTransformInverse: new THREE.Matrix4(),
  },
  `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position, 1.0); }
  `,
  `
  varying vec2 vUv;
  uniform vec3 size;
  uniform mat4 projectionInverse;
  uniform mat4 sdfTransformInverse;

  const float relative_step_size = 1.0;

  // distance to box bounds
  vec2 rayBoxDist( vec3 boundsMin, vec3 boundsMax, vec3 rayOrigin, vec3 rayDir ) {
    vec3 t0 = ( boundsMin - rayOrigin ) / rayDir;
    vec3 t1 = ( boundsMax - rayOrigin ) / rayDir;
    vec3 tmin = min( t0, t1 );
    vec3 tmax = max( t0, t1 );
    float distA = max( max( tmin.x, tmin.y ), tmin.z );
    float distB = min( tmax.x, min( tmax.y, tmax.z ) );
    float distToBox = max( 0.0, distA );
    float distInsideBox = max( 0.0, distB - distToBox );
    return vec2( distToBox, distInsideBox );
  }

  void main() {
    float fragCoordZ = -1.;

    // get the inverse of the sdf box transform mmxxxx 
    mat4 sdfTransform = inverse( sdfTransformInverse );
    // convert the uv to clip space for ray transformation
    vec2 clipSpace = 2.0 * vUv - vec2( 1.0 );
    // get world ray direction
    vec3 rayOrigin = vec3( 0.0 );
    vec4 homogenousDirection = projectionInverse * vec4( clipSpace, - 1.0, 1.0 );
    vec3 rayDirection = normalize( homogenousDirection.xyz / homogenousDirection.w );
    // transform ray into local coordinates of sdf bounds
    vec3 sdfRayOrigin = ( sdfTransformInverse * vec4( rayOrigin, 1.0 ) ).xyz;
    vec3 sdfRayDirection = normalize( ( sdfTransformInverse * vec4( rayDirection, 0.0 ) ).xyz );
    // find whether our ray hits the box bounds in the local box space
    vec2 boxIntersectionInfo = rayBoxDist( vec3( - 0.5 ), vec3( 0.5 ), sdfRayOrigin, sdfRayDirection );
    float distToBox = boxIntersectionInfo.x;
    float distInsideBox = boxIntersectionInfo.y;
    bool intersectsBox = distInsideBox > 0.0;
    gl_FragColor = vec4( 0.0 );

    if ( intersectsBox ) {
      int nsteps = int(boxIntersectionInfo.y * size.x / relative_step_size + 0.5);
      if ( nsteps < 1 ) discard;

      // For testing: show the number of steps. This helps to establish whether the rays are correctly oriented
      gl_FragColor = vec4(0.0, float(nsteps) / size.x, 1.0, 1.0);
      return;
    }

    if (gl_FragColor.a < 0.05){ discard; }
  }
  `
)
extend({ FullScreenMaterial })

export function Volume()
{
  const fullScreenMaterialRef = useRef()
  const [ inverseBoundsMatrix, setInverseBoundsMatrix ] = useState(null)

  useEffect(() =>
  {
    const w = 256
    const h = 256
    const d = 256

    const matrix = new THREE.Matrix4()
    const center = new THREE.Vector3()
    const quat = new THREE.Quaternion()
    const scaling = new THREE.Vector3()
    const s = 1 / Math.max(w, h, d)

    const inverseBoundsMatrix = new THREE.Matrix4()
    scaling.set(w * s, h * s, d * s)
    matrix.compose(center, quat, scaling)
    inverseBoundsMatrix.copy(matrix).invert()

    setInverseBoundsMatrix(inverseBoundsMatrix)
    fullScreenMaterialRef.current.size.set(w, h, d)
  }, [])

  useFrame((state, delta) =>
  {
    if (!inverseBoundsMatrix) return

    state.camera.updateMatrixWorld()

    fullScreenMaterialRef.current.projectionInverse
      .copy(state.camera.projectionMatrixInverse)

    fullScreenMaterialRef.current.sdfTransformInverse
      .copy(new THREE.Matrix4())
      .invert()
      .premultiply(inverseBoundsMatrix)
      .multiply(state.camera.matrixWorld)
  })

  return <mesh>
    <planeGeometry args={[ 2, 2, 1, 1 ]}/>
    <fullScreenMaterial ref={ fullScreenMaterialRef } />
  </mesh>
}

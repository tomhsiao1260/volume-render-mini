import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'

export default function App()
{
    const glSettings = { antialias: true, outputEncoding: THREE.sRGBEncoding }
    const cameraSettings = { fov: 75, near: 0.01, far: 50, position: [ 0, 0, -1.5 ], up: [ 0, -1, 0 ]}

    return <>
        <Canvas
            frameloop="demand"
            camera={ cameraSettings }
            gl={ glSettings }
        >
            <OrbitControls enableDamping={ false } makeDefault />
            <Cube />
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
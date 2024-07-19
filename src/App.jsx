import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'

export default function App()
{
    useFrame((state, delta) =>
    {
        console.log('tick')
    })

    return <>
        <OrbitControls enableDamping={ false } makeDefault />
        <Cube />
    </>
}

export function Cube()
{
    return <mesh>
        <boxGeometry args={[ 1, 1, 1 ]}/>
        <meshNormalMaterial />
    </mesh>
}
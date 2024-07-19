import * as THREE from 'three'
import { OrbitControls } from '@react-three/drei'

export default function App()
{
    return <>
        <OrbitControls makeDefault />

        <mesh>
            <boxGeometry />
            <meshNormalMaterial />
        </mesh>
    </>
}
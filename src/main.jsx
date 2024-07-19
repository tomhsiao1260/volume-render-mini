import './style.css'
import { StrictMode } from 'react'
import { Canvas } from '@react-three/fiber'
import ReactDOM from 'react-dom/client'
import App from './App'

const root = ReactDOM.createRoot(document.querySelector('#root'))

root.render(
    <StrictMode>
        <Canvas>
            <App />
        </Canvas>
    </StrictMode>
)
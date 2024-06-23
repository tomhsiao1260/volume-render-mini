import './style.css'
import * as THREE from 'three'
import ViewerCore from './core/ViewerCore'
import { GUI } from 'three/examples/jsm/libs/lil-gui.module.min'

init()

async function init() {
  // renderer setup
  const canvas = document.querySelector('.webgl')
  const renderer = new THREE.WebGLRenderer({ antialias: true, canvas: canvas })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setClearColor(0, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const viewer = new ViewerCore({ renderer, canvas })
  update(viewer)
}

function update(viewer) {
  viewer.render()
  updateGUI(viewer)
}

function updateGUI(viewer) {
  const gui = new GUI()
  gui.add(viewer.params, 'colorful', true).name('color').onChange(viewer.render)
}
'use client'

import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { Suspense } from 'react'
import LetterTorrent from './letterTorrent'

export default function Torrent() {
  return (
    <div className="w-full h-screen bg-white">
      <Canvas camera={{ position: [0, 0, 15], fov: 75 }}>
        <Suspense fallback={null}>
          <LetterTorrent />
          <OrbitControls enablePan={false} />
        </Suspense>
        {/* <ambientLight intensity={0.5} /> */}
        {/* <pointLight position={[10, 10, 10]} /> */}
      </Canvas>
    </div>
  )
}

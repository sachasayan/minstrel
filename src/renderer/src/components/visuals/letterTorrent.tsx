"use client"

import { useRef, useState, useEffect } from "react"
import { useFrame } from "@react-three/fiber"
import { Text } from "@react-three/drei"
import { type Group, Vector3 } from "three"

const LETTER_COUNT = 100
const RADIUS = 5
const HEIGHT = 10

interface LetterState {
  char: string
  position: Vector3
  rotation: Vector3
  speed: number
}

export default function LetterTorrent() {
  const groupRef = useRef<Group>(null)
  const [letters, setLetters] = useState<LetterState[]>([])

  useEffect(() => {
    const initialLetters = Array.from({ length: LETTER_COUNT }, () => ({
      char: String.fromCharCode(65 + Math.floor(Math.random() * 26)),
      position: new Vector3(
        (Math.random() - 0.5) * RADIUS,
        (Math.random() - 0.5) * HEIGHT,
        (Math.random() - 0.5) * RADIUS,
      ),
      rotation: new Vector3(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI),
      speed: Math.random() * 0.02 + 0.01,
    }))
    setLetters(initialLetters)
  }, [])

  useFrame((state) => {
    if (!groupRef.current) return

    setLetters((prevLetters) =>
      prevLetters.map((letter) => {
        const newPosition = letter.position.clone()
        newPosition.applyAxisAngle(new Vector3(0, 1, 0), letter.speed)
        newPosition.y += letter.speed * 0.5
        if (newPosition.y > HEIGHT / 2) {
          newPosition.y = -HEIGHT / 2
        }

        const newRotation = letter.rotation.clone()
        newRotation.x += letter.speed * 0.5
        newRotation.y += letter.speed * 0.3
        newRotation.z += letter.speed * 0.2

        return {
          ...letter,
          position: newPosition,
          rotation: newRotation,
        }
      }),
    )

    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.1
    }
  })

  return (
    <group ref={groupRef}>
      {letters.map((letter, index) => (
        <Text
          key={index}
          position={[letter.position.x, letter.position.y, letter.position.z]}
          rotation={[letter.rotation.x, letter.rotation.y, letter.rotation.z]}
          fontSize={0.5}
          color="black"
          anchorX="center"
          anchorY="middle"
        >
          {letter.char}
        </Text>
      ))}
    </group>
  )
}


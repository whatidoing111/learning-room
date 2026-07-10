import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { ContactShadows } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'
import Lighting from './Lighting'
import { useStore } from '../../store/useStore'

function Desk() {
  return (
    <group position={[0, 0.4, 0]}>
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.08, 1.2]} />
        <meshStandardMaterial color="#8B6914" roughness={0.6} />
      </mesh>
      <mesh position={[-1.05, -0.35, -0.45]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#6B4F12" roughness={0.7} />
      </mesh>
      <mesh position={[1.05, -0.35, -0.45]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#6B4F12" roughness={0.7} />
      </mesh>
      <mesh position={[-1.05, -0.35, 0.45]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#6B4F12" roughness={0.7} />
      </mesh>
      <mesh position={[1.05, -0.35, 0.45]} castShadow>
        <boxGeometry args={[0.08, 0.7, 0.08]} />
        <meshStandardMaterial color="#6B4F12" roughness={0.7} />
      </mesh>
    </group>
  )
}

function Books() {
  return (
    <group position={[0.7, 0.48, -0.1]}>
      <mesh position={[0, 0.04, 0]} castShadow>
        <boxGeometry args={[0.35, 0.06, 0.25]} />
        <meshStandardMaterial color="#c0392b" roughness={0.8} />
      </mesh>
      <mesh position={[0.02, 0.1, 0.01]} castShadow>
        <boxGeometry args={[0.32, 0.05, 0.23]} />
        <meshStandardMaterial color="#2980b9" roughness={0.8} />
      </mesh>
      <mesh position={[-0.01, 0.15, -0.01]} castShadow>
        <boxGeometry args={[0.3, 0.04, 0.22]} />
        <meshStandardMaterial color="#27ae60" roughness={0.8} />
      </mesh>
    </group>
  )
}

function PenHolder() {
  return (
    <group position={[-0.8, 0.44, 0.2]}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.2, 16]} />
        <meshStandardMaterial color="#5D4E37" roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh position={[0.02, 0.22, 0.01]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.15, 8]} />
        <meshStandardMaterial color="#2c3e50" roughness={0.3} />
      </mesh>
      <mesh position={[-0.02, 0.2, -0.01]} castShadow>
        <cylinderGeometry args={[0.008, 0.008, 0.12, 8]} />
        <meshStandardMaterial color="#c0392b" roughness={0.3} />
      </mesh>
    </group>
  )
}

function CoffeeCup() {
  return (
    <group position={[-0.4, 0.44, 0.35]}>
      <mesh position={[0, 0.07, 0]} castShadow>
        <cylinderGeometry args={[0.055, 0.045, 0.14, 16]} />
        <meshStandardMaterial color="#f5f5f0" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.135, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.01, 16]} />
        <meshStandardMaterial color="#3e2723" roughness={0.2} />
      </mesh>
      <mesh position={[0.07, 0.07, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <torusGeometry args={[0.03, 0.008, 8, 16, Math.PI]} />
        <meshStandardMaterial color="#f5f5f0" roughness={0.3} />
      </mesh>
    </group>
  )
}

function DeskLamp() {
  return (
    <group position={[-1.0, 0.44, -0.3]}>
      <mesh position={[0, 0.005, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.01, 16]} />
        <meshStandardMaterial color="#2c2c2c" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.5, 8]} />
        <meshStandardMaterial color="#3c3c3c" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.5, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.15, 8]} />
        <meshStandardMaterial color="#3c3c3c" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0.05, 0.55, 0.05]} rotation={[0.3, 0, 0.3]} castShadow>
        <coneGeometry args={[0.1, 0.12, 16, 1, true]} />
        <meshStandardMaterial color="#f5f5dc" roughness={0.5} side={THREE.DoubleSide} />
      </mesh>
      <pointLight
        position={[0.05, 0.48, 0.05]}
        color="#ffcc66"
        intensity={2}
        distance={3}
        decay={2}
      />
    </group>
  )
}

function Window() {
  const theme = useStore((s) => s.theme)
  const skyColor = theme === 'light' ? '#87CEEB' : theme === 'rain' ? '#708090' : '#0a0a2e'

  return (
    <group position={[1.5, 1.5, -1.49]}>
      <mesh>
        <planeGeometry args={[1.2, 1.0]} />
        <meshStandardMaterial
          color={skyColor}
          transparent
          opacity={0.85}
          roughness={0.1}
          metalness={0.1}
        />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[1.3, 0.04]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[0.04, 1.1]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.8} />
      </mesh>
      <mesh position={[-0.6, 0, 0.02]}>
        <planeGeometry args={[0.04, 1.1]} />
        <meshStandardMaterial color="#f0e8d0" roughness={0.8} />
      </mesh>
      <mesh position={[0.6, 0, 0.02]}>
        <planeGeometry args={[0.04, 1.1]} />
        <meshStandardMaterial color="#f0e8d0" roughness={0.8} />
      </mesh>
      <mesh position={[0, -0.5, 0.02]}>
        <planeGeometry args={[1.3, 0.04]} />
        <meshStandardMaterial color="#f0e8d0" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.5, 0.02]}>
        <planeGeometry args={[1.3, 0.04]} />
        <meshStandardMaterial color="#f0e8d0" roughness={0.8} />
      </mesh>
    </group>
  )
}

function Floor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <planeGeometry args={[8, 8]} />
      <meshStandardMaterial color="#d4a76a" roughness={0.9} />
    </mesh>
  )
}

function Wall() {
  return (
    <group>
      <mesh position={[0, 1.5, -1.5]} receiveShadow>
        <planeGeometry args={[8, 3]} />
        <meshStandardMaterial color="#f5f0e0" roughness={0.95} />
      </mesh>
      <mesh position={[-2.5, 1.5, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#f0ead6" roughness={0.95} />
      </mesh>
      <mesh position={[2.5, 1.5, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[4, 3]} />
        <meshStandardMaterial color="#f0ead6" roughness={0.95} />
      </mesh>
    </group>
  )
}

function CameraRig() {
  const { camera } = useThree()
  const mouseRef = useRef({ x: 0, y: 0 })

  useFrame((state) => {
    const pointer = state.pointer
    mouseRef.current.x += (pointer.x * 0.3 - mouseRef.current.x) * 0.05
    mouseRef.current.y += (pointer.y * 0.2 - mouseRef.current.y) * 0.05

    camera.position.x = mouseRef.current.x * 0.5
    camera.position.y = 1.5 + mouseRef.current.y * 0.15
    camera.position.z = 2

    camera.lookAt(0, 0.8, -0.5)
  })

  return null
}

function SceneContent() {
  return (
    <>
      <Desk />
      <Books />
      <PenHolder />
      <CoffeeCup />
      <DeskLamp />
      <Window />
      <Floor />
      <Wall />
      <Lighting />
      <ContactShadows
        position={[0, 0.001, 0]}
        opacity={0.4}
        scale={10}
        blur={2}
        far={4}
      />
      <CameraRig />
    </>
  )
}

export default function StudyRoom() {
  const theme = useStore((s) => s.theme)
  const bgColor = theme === 'light' ? '#f0e6d2' : theme === 'rain' ? '#3a3a4a' : '#1a1a2e'

  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <Canvas
        shadows
        camera={{ position: [0, 1.5, 2], fov: 50 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
      >
        <color attach="background" args={[bgColor]} />
        <fog attach="fog" args={[bgColor, 5, 15]} />
        <SceneContent />
      </Canvas>
    </div>
  )
}

import { useStore } from '../../store/useStore'

export default function Lighting() {
  const theme = useStore((s) => s.theme)

  const isLight = theme === 'light'
  const isRain = theme === 'rain'

  const sunColor = isLight ? '#fff5e6' : isRain ? '#8899aa' : '#334466'
  const sunIntensity = isLight ? 1.2 : isRain ? 0.4 : 0.15

  const lampColor = '#ffaa44'
  const lampIntensity = isLight ? 0.6 : 2.5

  const ambientColor = isLight ? '#ffe8cc' : isRain ? '#556677' : '#1a1a2e'
  const ambientIntensity = isLight ? 0.4 : isRain ? 0.25 : 0.1

  return (
    <>
      <directionalLight
        position={[3, 4, -2]}
        color={sunColor}
        intensity={sunIntensity}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <pointLight
        position={[-1.2, 1.8, -0.5]}
        color={lampColor}
        intensity={lampIntensity}
        distance={6}
        decay={2}
        castShadow
      />
      <ambientLight color={ambientColor} intensity={ambientIntensity} />
    </>
  )
}

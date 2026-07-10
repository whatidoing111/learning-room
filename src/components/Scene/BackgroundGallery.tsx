import { useState, useEffect } from 'react'
import { useStore } from '../../store/useStore'

const backgrounds: Record<string, string[]> = {
  light: [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&q=80',
    'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1920&q=80',
    'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=1920&q=80',
  ],
  dark: [
    'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1920&q=80',
    'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=1920&q=80',
    'https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1920&q=80',
  ],
  rain: [
    'https://images.unsplash.com/photo-1428592953211-077101b2021b?w=1920&q=80',
    'https://images.unsplash.com/photo-1515694346937-94d85e39d29c?w=1920&q=80',
    'https://images.unsplash.com/photo-1501436513145-30f24e19fcc8?w=1920&q=80',
  ],
}

export default function BackgroundGallery() {
  const theme = useStore((s) => s.theme)
  const [currentIndex, setCurrentIndex] = useState(0)

  const images = backgrounds[theme] || backgrounds.light

  useEffect(() => {
    setCurrentIndex(0)
  }, [theme])

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 20000)

    return () => clearInterval(timer)
  }, [images.length])

  return (
    <div className="fixed inset-0 z-0">
      <img
        src={images[currentIndex]}
        alt="学习室背景"
        className="h-full w-full object-cover transition-opacity duration-[3000ms] ease-in-out"
      />
      <div className="absolute inset-0 bg-black/30 backdrop-blur-[2px]" />
    </div>
  )
}

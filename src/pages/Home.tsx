import Header from '@/components/Layout/Header';
import Hero from '@/components/Home/Hero';

export default function Home() {
  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #1a1a2e 0%, #2d2d3f 30%, #4a4a5a 60%, #6b6b7b 100%)' }}>
      <Header />
      <main>
        <Hero />
      </main>
    </div>
  );
}

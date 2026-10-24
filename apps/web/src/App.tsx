import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Features from './components/Features'
import HowItWorks from './components/HowItWorks'
import Pricing from './components/Pricing'
import TryLuminarySection from './components/TryLuminarySection'
import Footer from './components/Footer'

export default function App() {
  return (
    <div className="min-h-screen bg-surface text-on-surface-variant">
      <Navbar />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Pricing />
        <TryLuminarySection />
      </main>
      <Footer />
    </div>
  )
}

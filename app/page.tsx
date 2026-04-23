import { Header } from "@/components/header"
import { HeroSection } from "@/components/hero-section"
import { PartnersSection } from "@/components/partners-section"
import { CoursesSection } from "@/components/courses-section"
import { FeaturesSection } from "@/components/features-section"
import { CtaSection } from "@/components/cta-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import { Footer } from "@/components/footer"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <PartnersSection />
      <CoursesSection />
      <FeaturesSection />
      <CtaSection />
      <TestimonialsSection />
      <Footer />
      <SpeedInsights />
    </main>
  )
}

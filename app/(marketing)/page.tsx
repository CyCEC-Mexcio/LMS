import { HeroSection } from "@/components/hero-section"
import { PartnersSection } from "@/components/partners-section"
import { CoursesSection } from "@/components/courses-section"
import { FeaturesSection } from "@/components/features-section"
import { CtaSection } from "@/components/cta-section"
import { TestimonialsSection } from "@/components/testimonials-section"

export default function LandingPage() {
  return (
    <>
      <HeroSection />
      <PartnersSection />
      <CoursesSection />
      <FeaturesSection />
      <CtaSection />
      <TestimonialsSection />
    </>
  )
}

import LandingNav from "@/components/landing/LandingNav";
import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import HowItWorks from "@/components/landing/HowItWorks";
import LandingFooter from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div className="flex min-h-full flex-col bg-background">
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
      </main>
      <LandingFooter />
    </div>
  );
}

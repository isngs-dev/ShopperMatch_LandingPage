import Background from "@/components/Background";
import Footer from "@/components/Footer";
import GlobalEffects from "@/components/GlobalEffects";
import Navbar from "@/components/Navbar";
import Hero from "@/components/sections/Hero";
import ProblemSolution from "@/components/sections/ProblemSolution";
import Features from "@/components/sections/Features";
import About from "@/components/sections/About";
import FormSection from "@/components/sections/FormSection";

export default function Page() {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <GlobalEffects />
      <Background />
      <Navbar />
      <main id="main" className="relative z-10">
        <Hero />
        <ProblemSolution />
        <Features />
        <About />
        <FormSection />
      </main>
      <Footer />
    </>
  );
}

import Nav from "@/components/yoodli/Nav";
import Hero from "@/components/yoodli/Hero";
import Carousel from "@/components/yoodli/Carousel";
import Cases from "@/components/yoodli/Cases";
import Featured from "@/components/yoodli/Featured";
import Demo from "@/components/yoodli/Demo";
import HowToUse from "@/components/yoodli/HowToUse";
import Roleplay from "@/components/yoodli/Roleplay";
import Pitch from "@/components/yoodli/Pitch";
import More from "@/components/yoodli/More";
import Footer from "@/components/yoodli/Footer";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Carousel />
        <Cases />
        <Featured />
        <Demo />
        <HowToUse />
        <Roleplay />
        <Pitch />
        <More />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
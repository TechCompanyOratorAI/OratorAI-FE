import Nav from "@/components/Header/Nav";
import Hero from "@/components/yoodli/Hero";
import Carousel from "@/components/yoodli/Carousel";
import Featured from "@/components/yoodli/Featured";
import HowToUse from "@/components/yoodli/HowToUse";
import Roleplay from "@/components/yoodli/Roleplay";
import Pitch from "@/components/yoodli/Pitch";
import Footer from "@/components/Footer/Footer";

const HomePage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Carousel />
        <Featured />

        <HowToUse />
        <Roleplay />
        <Pitch />
        {/* <More /> */}
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;
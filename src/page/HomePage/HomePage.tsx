import Nav from "@/components/Header/Nav";
import Hero from "@/components/yoodli/Hero";
import Carousel from "@/components/yoodli/Carousel";
import Featured from "@/components/yoodli/Featured";
import HowToUse from "@/components/yoodli/HowToUse";
import Roleplay from "@/components/yoodli/Roleplay";
import Pitch from "@/components/yoodli/Pitch";
import Footer from "@/components/Footer/Footer";
import { useAppSelector } from "@/services/store/store";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const { isAuthenticated, user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    const role = user.roles?.[0]?.roleName;
    if (role === "Student") {
      navigate("/student/dashboard", { replace: true });
    } else if (role === "Instructor") {
      navigate("/instructor/manage-classes", { replace: true });
    } else if (role === "Admin") {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  if (!isAuthenticated || !user) {
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
        </main>
        <Footer />
      </div>
    );
  }
};

export default HomePage;
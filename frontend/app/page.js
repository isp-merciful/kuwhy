import { Navbar } from "./components/navbar";
import LandingPage from "./components/landingpage/landingpage";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <LandingPage />
    </div>
  );
}

import { Footer } from "@/components/ajir/Footer";
import { Header } from "@/components/ajir/Header";
import { InspirationSection } from "@/components/ajir/InspirationSection";
import { AjirPlatform } from "@/components/ajir/AjirPlatform";
import { PropertyCarousel } from "@/components/ajir/PropertyCarousel";
import { popularProperties, trendingProperties } from "@/data/ajir-properties";

const Index = () => {
  return (
    <main className="min-h-screen bg-background font-sans text-foreground">
      <Header />
      <div className="h-[194px]" />
      <div className="space-y-12 py-8">
        <PropertyCarousel title="Popular homes in Morocco" properties={popularProperties} />
        <PropertyCarousel title="Trending getaways" properties={trendingProperties} />
        <PropertyCarousel title="Beach stays near you" properties={[...popularProperties].reverse()} />
        <PropertyCarousel title="Fresh city escapes" properties={[...trendingProperties].reverse()} />
      </div>
      <AjirPlatform />
      <InspirationSection />
      <Footer />
    </main>
  );
};

export default Index;

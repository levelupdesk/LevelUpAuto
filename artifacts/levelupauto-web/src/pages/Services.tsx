import { useState } from "react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, Settings, Droplets, Zap, Activity, CircleDashed } from "lucide-react";
import { useListServices } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const categoryIcons: Record<string, React.ReactNode> = {
  "oil-change": <Droplets className="w-6 h-6" />,
  "brakes": <CircleDashed className="w-6 h-6" />,
  "diagnostics": <Activity className="w-6 h-6" />,
  "transmission": <Settings className="w-6 h-6" />,
  "other": <Zap className="w-6 h-6" />
};

export default function Services() {
  const { data: services, isLoading, isError } = useListServices();
  const [filter, setFilter] = useState<string | null>(null);

  const categories = Array.from(new Set(services?.map(s => s.category) || []));

  const filteredServices = filter 
    ? services?.filter(s => s.category === filter)
    : services;

  return (
    <div className="min-h-screen pt-24 pb-20 bg-carbon">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl md:text-6xl font-black font-display mb-6">OUR <span className="text-primary">SERVICES</span></h1>
          <p className="text-xl text-muted-foreground">
            From routine maintenance to complex diagnostics, our master technicians handle it all with precision and care.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap justify-center gap-3 mb-16">
          <button
            onClick={() => setFilter(null)}
            className={cn(
              "px-6 py-2.5 rounded-full font-semibold text-sm transition-all border",
              filter === null 
                ? "bg-primary border-primary text-white box-glow" 
                : "bg-secondary border-border text-muted-foreground hover:text-white hover:border-muted-foreground"
            )}
          >
            All Services
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "px-6 py-2.5 rounded-full font-semibold text-sm transition-all border capitalize",
                filter === cat 
                  ? "bg-primary border-primary text-white box-glow" 
                  : "bg-secondary border-border text-muted-foreground hover:text-white hover:border-muted-foreground"
              )}
            >
              {cat.replace('-', ' ')}
            </button>
          ))}
        </div>

        {isError ? (
          <div className="text-center py-16 text-muted-foreground">Our service menu is temporarily unavailable. Please call or contact us for pricing and availability.</div>
        ) : isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-card/50 rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredServices?.map((service, idx) => (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                key={service.id}
                className="bg-card border border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col group transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.5)]"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    {categoryIcons[service.category] || <Settings className="w-6 h-6" />}
                  </div>
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                    {service.category.replace('-', ' ')}
                  </span>
                </div>
                
                <h3 className="text-2xl font-bold font-display mb-3">{service.name}</h3>
                <p className="text-muted-foreground flex-grow mb-6">{service.description}</p>
                
                <div className="flex items-end justify-between mt-auto">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Starting at</div>
                    <div className="text-3xl font-black text-white">${service.price}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-muted-foreground mb-1">Est. Time</div>
                    <div className="font-semibold text-white">{service.durationMinutes} mins</div>
                  </div>
                </div>
                
                <Link 
                  href={`/book?service=${service.id}`}
                  className="mt-8 w-full py-4 rounded-xl bg-secondary text-white font-bold text-center hover:bg-primary transition-colors flex justify-center items-center gap-2"
                >
                  Book This Service <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

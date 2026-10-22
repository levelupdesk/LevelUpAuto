import { useListTestimonials } from "@workspace/api-client-react";
import { Star, Quote } from "lucide-react";
import { motion } from "framer-motion";

export default function Testimonials() {
  const { data: testimonials, isLoading, isError } = useListTestimonials();

  return (
    <div className="min-h-screen pt-24 pb-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-6 text-primary">
            <Star className="w-4 h-4 fill-primary" />
            <Star className="w-4 h-4 fill-primary" />
            <Star className="w-4 h-4 fill-primary" />
            <Star className="w-4 h-4 fill-primary" />
            <Star className="w-4 h-4 fill-primary" />
          </div>
          <h1 className="text-4xl md:text-6xl font-black font-display mb-6">CLIENT <span className="text-primary">STORIES</span></h1>
          <p className="text-xl text-muted-foreground">
            Don't just take our word for it. Hear what our community of automotive enthusiasts has to say.
          </p>
        </div>

        {isError ? (
          <div className="text-center py-16 text-muted-foreground">Reviews are temporarily unavailable. Please check back soon.</div>
        ) : isLoading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
             {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-64 bg-card rounded-2xl animate-pulse border border-border" />
            ))}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {testimonials?.map((testimonial, idx) => (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.1 }}
                key={testimonial.id}
                className="bg-card border border-border rounded-3xl p-8 relative"
              >
                <Quote className="absolute top-6 right-6 w-12 h-12 text-border/50 -z-0" />
                <div className="flex gap-1 mb-6 relative z-10">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star 
                      key={i} 
                      className={`w-5 h-5 ${i < testimonial.rating ? 'text-primary fill-primary' : 'text-muted'}`} 
                    />
                  ))}
                </div>
                <p className="text-lg text-foreground mb-8 relative z-10 leading-relaxed italic">
                  "{testimonial.comment}"
                </p>
                <div className="border-t border-border pt-6 mt-auto">
                  <div className="font-bold text-white font-display text-lg">{testimonial.customerName}</div>
                  <div className="text-sm text-primary">Service: {testimonial.serviceName}</div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

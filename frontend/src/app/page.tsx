import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";
import {
  FileText,
  Briefcase,
  UserCheck,
  Globe,
  Shield,
  Zap,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  Building,
  Heart,
  Sparkles,
  TrendingUp,
  Clock,
} from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero Section - Enhanced */}
      <section className="gradient-hero relative overflow-hidden">
        {/* Background Image - priority removed */}
        <div className="absolute inset-0">
          <Image
            src="/hero.png"
            alt="Nursing Background"
            fill
            className="object-cover opacity-20"
          />
        </div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-sky-200/10 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 lg:py-32 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-sm font-medium mb-8 border border-white/20 hover:bg-white/15 transition-all duration-300 hover:scale-105">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Trusted by 10,000+ nurses nationwide</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white mb-6 leading-[1.1] animate-fade-in">
            Your Nursing Career,{" "}
            <span className="text-medical-blue-600 inline-block hover:scale-105 transition-transform duration-300">
              Simplified
            </span>
          </h1>

          <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
            Register your profile, upload your resume, and discover nursing
            opportunities that match your experience — locally and internationally.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-fade-in-up-delayed">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-10 font-semibold bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                Register as a Nurse
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="ghost"
                className="w-full h-12 px-10 font-semibold text-white gradient-primary hover:text-black hover:brightness-125 transition-all duration-300">
                    Sign In
              </Button>
            </Link>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-white/75 animate-fade-in-up-more-delayed">
            {[
              { icon: CheckCircle, text: "Free registration", color: "text-emerald-400" },
              { icon: Sparkles, text: "AI resume conversion", color: "text-sky-300" },
              { icon: TrendingUp, text: "Smart job matching", color: "text-emerald-400" },
              { icon: Users, text: "Open to students", color: "text-sky-200" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 group">
                <item.icon className={`h-4 w-4 ${item.color} group-hover:scale-110 transition-transform`} />
                <span className="group-hover:text-white transition-colors">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-20 px-4 sm:px-6 border-b border-border bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Users, value: "10,000+", label: "Registered Nurses", color: "primary" },
              { icon: Building, value: "500+", label: "Partner Facilities", color: "success" },
              { icon: Globe, value: "15+", label: "Countries Served", color: "info" },
              { icon: Star, value: "95%", label: "Satisfaction Rate", color: "warning" },
            ].map((stat, index) => (
              <div
                key={stat.label}
                className="text-center group hover:scale-105 transition-all duration-300 animate-fade-in-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 mb-4 group-hover:from-primary/20 group-hover:to-primary/10 transition-all duration-300 group-hover:rotate-6 shadow-sm">
                  <stat.icon className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                </div>
                <p className="text-3xl font-bold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-4 tracking-wide uppercase border border-primary/20">
              <Clock className="w-3.5 h-3.5" />
              Simple Process
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Get started in minutes with our streamlined registration process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: 1,
                icon: UserCheck,
                title: "Create Your Profile",
                desc: "Complete a simple registration with your personal info, professional background, and certifications.",
                gradient: "from-blue-500/10 to-sky-500/10",
                iconGradient: "from-blue-500 to-sky-500",
              },
              {
                step: 2,
                icon: FileText,
                title: "Upload Your Resume",
                desc: "Upload your resume in PDF or Word format. We automatically extract your experience and skills.",
                gradient: "from-purple-500/10 to-pink-500/10",
                iconGradient: "from-purple-500 to-pink-500",
              },
              {
                step: 3,
                icon: Briefcase,
                title: "Get Matched to Jobs",
                desc: "See job opportunities that match your qualifications — from local hospitals to international placements.",
                gradient: "from-emerald-500/10 to-teal-500/10",
                iconGradient: "from-emerald-500 to-teal-500",
              },
            ].map((item, index) => (
              <div
                key={item.step}
                className="relative bg-card rounded-2xl p-8 border border-border shadow-lg hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Step number badge */}
                <div className="absolute -top-4 left-8 h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white text-sm font-bold shadow-lg group-hover:scale-110 transition-transform">
                  {item.step}
                </div>

                {/* Connecting line for desktop */}
                {item.step < 3 && (
                  <div className="hidden md:block absolute top-12 -right-4 w-8 h-0.5 bg-gradient-to-r from-border to-transparent" />
                )}

                {/* Icon with gradient background */}
                <div className={`h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                  <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${item.iconGradient} flex items-center justify-center`}>
                    <item.icon className="h-7 w-7 text-white" />
                  </div>
                </div>

                <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits - Enhanced */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-4 tracking-wide uppercase border border-primary/20">
              <Sparkles className="w-3.5 h-3.5" />
              Why Choose Us
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              Why Nurse Care Pro?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We make the job search process easier, faster, and more effective
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Zap,
                title: "AI Resume Reading",
                desc: "Upload your resume and we extract your details automatically using AI.",
                color: "from-yellow-500/20 to-orange-500/20",
                iconColor: "from-yellow-500 to-orange-500",
              },
              {
                icon: Shield,
                title: "Smart Matching",
                desc: "Get matched to positions based on your certifications, experience, and skills.",
                color: "from-blue-500/20 to-cyan-500/20",
                iconColor: "from-blue-500 to-cyan-500",
              },
              {
                icon: Globe,
                title: "Global Opportunities",
                desc: "Find positions in Philippine hospitals, Middle East, UK, and 15+ countries.",
                color: "from-green-500/20 to-emerald-500/20",
                iconColor: "from-green-500 to-emerald-500",
              },
              {
                icon: Heart,
                title: "Free to Use",
                desc: "Registration and profile creation is completely free. No hidden fees, ever.",
                color: "from-pink-500/20 to-rose-500/20",
                iconColor: "from-pink-500 to-rose-500",
              },
            ].map((benefit, index) => (
              <div
                key={benefit.title}
                className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/30 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${benefit.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                  <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${benefit.iconColor} flex items-center justify-center`}>
                    <benefit.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <h4 className="font-bold mb-2 text-base group-hover:text-primary transition-colors">
                  {benefit.title}
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {benefit.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials - Enhanced */}
      <section className="py-24 px-4 sm:px-6 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-4 tracking-wide uppercase border border-primary/20">
              <Star className="w-3.5 h-3.5 fill-current" />
              Testimonials
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
              What Nurses Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote:
                  "Nurse Care Pro helped me find an ICU position abroad in just 2 weeks. The resume conversion saved me hours!",
                initials: "MA",
                name: "Maria A.",
                role: "ICU Nurse, Dubai",
                gradient: "from-blue-500/10 to-sky-500/10",
              },
              {
                quote:
                  "The matching algorithm is amazing! It found me a perfect fit based on my NCLEX and BLS certifications.",
                initials: "JR",
                name: "Jose R.",
                role: "ER Nurse, Manila",
                gradient: "from-purple-500/10 to-pink-500/10",
              },
              {
                quote:
                  "So easy to use! I registered in 10 minutes and had job matches waiting. The platform truly understands nurses.",
                initials: "SC",
                name: "Sarah C.",
                role: "OR Nurse, Singapore",
                gradient: "from-emerald-500/10 to-teal-500/10",
              },
            ].map((testimonial, index) => (
              <div
                key={testimonial.initials}
                className="bg-card rounded-2xl p-7 border border-border shadow-lg hover:shadow-2xl transition-all duration-500 group hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="h-4 w-4 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform"
                      style={{ transitionDelay: `${i * 50}ms` }}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed italic">
                  &ldquo;{testimonial.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center border-2 border-primary/20 group-hover:scale-110 transition-transform`}>
                    <span className="text-primary font-bold text-sm">
                      {testimonial.initials}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-bold">{testimonial.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section - Enhanced */}
      <section className="bg-primary py-24 px-4 sm:px-6 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 left-10 w-80 h-80 bg-sky-200/10 rounded-full blur-3xl animate-float-delayed" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white/90 text-sm font-medium mb-6 border border-white/20">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            <span>Join our growing community</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-6 animate-fade-in">
            Ready to Start Your Journey?
          </h2>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto leading-relaxed animate-fade-in-up">
            Join thousands of nurses who have found their next opportunity
            through our platform.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up-delayed">
            <Link href="/register">
              <Button
                size="lg"
                className="h-12 px-10 font-semibold bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group"
              >
                Register Now
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link href="/login">
              <Button
                size="lg"
                variant="ghost"
                className="w-full h-12 px-10 font-semibold text-white gradient-primary hover:text-black hover:brightness-125 transition-all duration-300">
                    Sign In
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
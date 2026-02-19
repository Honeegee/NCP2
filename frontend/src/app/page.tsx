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

      {/* ── Hero ── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        {/* Background image */}
        <div className="absolute inset-0">
          <Image
            src="/hero.png"
            alt="Nursing Background"
            fill
            className="object-cover"
            priority
          />
          {/* Rich gradient overlay — darker at top for navbar legibility, opens up toward bottom */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#0d4f43]/90 via-[#1a7a65]/75 to-[#0d9e82]/60" />
          {/* Subtle vignette */}
          <div className="absolute inset-0 bg-radial-gradient" style={{ background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)' }} />
        </div>

        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-emerald-400/10 blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full bg-teal-300/10 blur-3xl translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto px-6 py-28 lg:py-36 text-center w-full">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-white/90 text-sm font-medium mb-10 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            Trusted by 10,000+ nurses nationwide
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]" style={{ fontFamily: "'DM Sans', sans-serif", textShadow: '0 2px 20px rgba(0,0,0,0.2)' }}>
            Your Nursing Career,{" "}
            <span className="relative inline-block">
              <span className="relative z-10 text-emerald-300">Simplified</span>
              <span className="absolute -bottom-1 left-0 right-0 h-1 bg-emerald-400/50 rounded-full blur-sm" />
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-white/80 mb-12 max-w-2xl mx-auto leading-relaxed">
            Register your profile, upload your resume, and discover nursing
            opportunities that match your experience — locally and internationally.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link href="/login">
              <Button
                size="lg"
                className="h-13 px-10 text-base font-semibold text-white shadow-2xl transition-all duration-300 hover:scale-105 group rounded-xl btn-primary-green"
                style={{ height: '52px' }}
              >
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
              { icon: CheckCircle, text: "Free registration" },
              { icon: Sparkles, text: "AI resume conversion" },
              { icon: TrendingUp, text: "Smart job matching" },
              { icon: Users, text: "Open to students" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-white text-sm font-medium shadow-sm">
                <item.icon className="h-3.5 w-3.5 text-emerald-300 flex-shrink-0" />
                <span>{item.text}</span>
              </div>
            ))}
          </div>

          {/* Supporting text below pills */}
          <p className="mt-6 text-sm font-medium" style={{ color: 'var(--highlight-light)' }}>
            No credit card required · Cancel anytime · Trusted by nurses in 15+ countries
          </p>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 80L60 69.3C120 59 240 37 360 32C480 27 600 37 720 42.7C840 48 960 48 1080 42.7C1200 37 1320 27 1380 21.3L1440 16V80H1380C1320 80 1200 80 1080 80C960 80 840 80 720 80C600 80 480 80 360 80C240 80 120 80 60 80H0Z" fill="var(--background)" />
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 px-6 bg-background">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Users, value: "10,000+", label: "Registered Nurses" },
              { icon: Building, value: "500+", label: "Partner Facilities" },
              { icon: Globe, value: "15+", label: "Countries Served" },
              { icon: Star, value: "95%", label: "Satisfaction Rate" },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="group relative bg-card rounded-2xl p-6 border border-border text-center hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative">
                  <div className="inline-flex items-center justify-center h-12 w-12 rounded-xl bg-primary/8 mb-3 group-hover:bg-primary/15 transition-colors" style={{ background: 'rgba(30,151,129,0.08)' }}>
                    <stat.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-foreground mb-1">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-background via-muted/30 to-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-5 tracking-widest uppercase border border-primary/20">
              <Clock className="w-3 h-3" /> Simple Process
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground">
              How It Works
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Get started in minutes with our streamlined registration process
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 relative">
            {[
              {
                step: 1,
                icon: UserCheck,
                title: "Create Your Profile",
                desc: "Complete a simple registration with your personal info, professional background, and certifications.",
                iconBg: "from-blue-500 to-sky-400",
                accent: "#3b82f6",
              },
              {
                step: 2,
                icon: FileText,
                title: "Upload Your Resume",
                desc: "Upload your resume in PDF or Word format. We automatically extract your experience and skills.",
                iconBg: "from-violet-500 to-purple-400",
                accent: "#8b5cf6",
              },
              {
                step: 3,
                icon: Briefcase,
                title: "Get Matched to Jobs",
                desc: "See job opportunities that match your qualifications — from local hospitals to international placements.",
                iconBg: "from-emerald-500 to-teal-400",
                accent: "#10b981",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative bg-card rounded-2xl p-8 border border-border hover:border-primary/25 hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group flex flex-col items-start"
              >
                {/* Step bubble — clean numbered circle */}
                <div
                  className="relative z-10 flex items-center justify-center h-[52px] w-[52px] rounded-2xl bg-gradient-to-br shadow-lg mb-7 group-hover:scale-110 transition-transform duration-300"
                  style={{ background: `linear-gradient(135deg, ${item.accent}, ${item.accent}cc)` }}
                >
                  <item.icon className="h-[22px] w-[22px] text-white" />
                  {/* Step number badge in corner */}
                  <span
                    className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-white border-2 flex items-center justify-center text-[10px] font-black shadow-sm"
                    style={{ color: item.accent, borderColor: item.accent }}
                  >
                    {item.step}
                  </span>
                </div>

                <h3 className="text-lg font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>{/* end grid */}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-5 tracking-widest uppercase border border-primary/20">
              <Sparkles className="w-3 h-3" /> Why Choose Us
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-foreground">
              Why Nurse Care Pro?
            </h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              We make the job search process easier, faster, and more effective
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: Zap,
                title: "AI Resume Reading",
                desc: "Upload your resume and we extract your details automatically using AI.",
                gradient: "from-amber-500 to-yellow-400",
                glow: "rgba(245,158,11,0.15)",
              },
              {
                icon: Shield,
                title: "Smart Matching",
                desc: "Get matched to positions based on your certifications, experience, and skills.",
                gradient: "from-blue-500 to-cyan-500",
                glow: "rgba(59,130,246,0.15)",
              },
              {
                icon: Globe,
                title: "Global Opportunities",
                desc: "Find positions in Philippine hospitals, Middle East, UK, and 15+ countries.",
                gradient: "from-emerald-500 to-green-500",
                glow: "rgba(16,185,129,0.15)",
              },
              {
                icon: Heart,
                title: "Free to Use",
                desc: "Registration and profile creation is completely free. No hidden fees, ever.",
                gradient: "from-rose-500 to-pink-500",
                glow: "rgba(244,63,94,0.15)",
              },
            ].map((b) => (
              <div
                key={b.title}
                className="group bg-card rounded-2xl p-6 border border-border hover:border-primary/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 -translate-y-1/2 translate-x-1/4" style={{ background: b.glow }} />
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${b.gradient} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300 shadow-md`}>
                  <b.icon className="h-5.5 w-5.5 text-white" style={{ width: '22px', height: '22px' }} />
                </div>
                <h4 className="font-bold mb-2 text-base text-foreground group-hover:text-primary transition-colors">{b.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 bg-gradient-to-b from-muted/20 to-background">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-semibold text-xs mb-5 tracking-widest uppercase border border-primary/20">
              <Star className="w-3 h-3 fill-current" /> Testimonials
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-foreground">
              What Nurses Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                quote: "Nurse Care Pro helped me find an ICU position abroad in just 2 weeks. The resume conversion saved me hours!",
                initials: "MA",
                name: "Maria A.",
                role: "ICU Nurse, Dubai",
                color: "from-blue-500 to-sky-400",
              },
              {
                quote: "The matching algorithm is amazing! It found me a perfect fit based on my NCLEX and BLS certifications.",
                initials: "JR",
                name: "Jose R.",
                role: "ER Nurse, Manila",
                color: "from-violet-500 to-purple-400",
                featured: true,
              },
              {
                quote: "So easy to use! I registered in 10 minutes and had job matches waiting. The platform truly understands nurses.",
                initials: "SC",
                name: "Sarah C.",
                role: "OR Nurse, Singapore",
                color: "from-emerald-500 to-teal-400",
              },
            ].map((t, i) => (
              <div
                key={t.initials}
                className={`relative bg-card rounded-2xl p-7 border transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl ${
                  t.featured
                    ? "border-primary/30 shadow-lg shadow-primary/10 ring-1 ring-primary/10"
                    : "border-border hover:border-primary/20"
                }`}
              >
                {t.featured && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white text-[11px] font-bold rounded-full tracking-wide uppercase shadow">
                    Featured
                  </div>
                )}
                <div className="flex gap-1 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic mb-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className={`h-11 w-11 rounded-full bg-gradient-to-br ${t.color} flex items-center justify-center shadow-md`}>
                    <span className="text-white font-bold text-sm">{t.initials}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d4f43] via-primary to-[#1a9e85]" />
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255,255,255,0.05) 0%, transparent 50%)' }} />

        {/* Decorative rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-white/5 pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-white/8 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-sm text-white/85 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4 text-emerald-300" />
            Join our growing community
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5 leading-tight">
            Ready to Start<br />Your Journey?
          </h2>
          <p className="text-lg text-white/75 mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of nurses who have found their next opportunity through our platform.
          </p>

          <Link href="/login">
            <Button
              size="lg"
              className="h-14 px-12 text-base font-bold text-white shadow-2xl transition-all duration-300 hover:scale-105 rounded-xl group btn-primary-green"
            >
              Get Started — It&apos;s Free
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>

          <p className="mt-5 text-sm" style={{ color: 'var(--highlight-light)' }}>No credit card required · Takes under 5 minutes</p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
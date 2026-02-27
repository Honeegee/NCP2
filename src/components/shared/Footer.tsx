import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

const heroGradient = "linear-gradient(135deg, var(--admin-hero-from) 0%, var(--admin-hero-via-1) 40%, var(--admin-hero-via-2) 70%, var(--admin-hero-to) 100%)";

export function Footer() {
  return (
    <footer className="border-t border-white/10 mt-auto" style={{ background: heroGradient }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Brand & Description */}
          <div className="lg:col-span-5">
            <div className="mb-3 -ml-4 w-fit">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/25 blur-xl rounded-full" />
                <Image
                  src="/logo.png"
                  alt="Nurse Care Pro"
                  width={200}
                  height={80}
                  className="h-20 w-auto object-contain relative drop-shadow-[0_0_1px_rgba(2,150,180,0.7)] group-hover:drop-shadow-[0_0_2px_rgba(2,150,180,1),0_0_12px_rgba(6,182,212,0.9)] transition-all duration-300"
                  unoptimized
                />
              </div>
            </div>
            <p className="text-sm text-white/70 leading-relaxed max-w-md mb-4">
              Empowering nurses to find their next opportunity. Register your
              profile, upload your resume, and get matched with positions
              locally and internationally.
            </p>

            {/* Newsletter */}
            <div className="mt-4 pt-4 border-t border-white/10">
              <h5 className="font-semibold text-xs mb-1.5 text-white">Stay Updated</h5>
              <p className="text-xs text-white/70 mb-2">
                Get job opportunities &amp; career tips
              </p>
              <div className="flex flex-col sm:flex-row gap-1.5">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="h-8 text-xs flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 focus:border-white/40 focus:ring-white/20"
                />
                <Button className="h-8 px-4 font-medium text-xs shadow-sm transition-all duration-200 hover:scale-105 btn-highlight">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Resources */}
          <div className="lg:col-span-3 lg:pl-40">
            <h4 className="font-semibold text-sm mb-3 text-white">Resources</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/help", label: "Help Center" },
                { href: "/blog", label: "Career Blog" },
                { href: "/guides", label: "Career Guides" },
                { href: "/faq", label: "FAQ" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-white/70 hover:text-white transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-4 lg:pl-32">
            <h4 className="font-semibold text-sm mb-3 text-white">Contact Us</h4>
            <ul className="space-y-2.5 mb-5">
              {[
                { icon: Mail, label: "Email", value: "support@nursecarepro.com", href: "mailto:support@nursecarepro.com" },
                { icon: Phone, label: "Phone", value: "+63 (2) 8888-0000", href: "tel:+6328888000" },
                { icon: MapPin, label: "Location", value: "Manila, Philippines", href: null },
              ].map(({ icon: Icon, label, value, href }) => (
                <li key={label} className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0 h-10 w-10 rounded-lg bg-white/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-white/80" />
                  </div>
                  <div>
                    <p className="text-xs text-white/50 mb-0.5">{label}</p>
                    {href ? (
                      <a href={href} className="text-sm text-white/90 hover:text-white transition-colors">
                        {value}
                      </a>
                    ) : (
                      <p className="text-sm text-white/90">{value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Social Links */}
            <div>
              <h5 className="font-semibold text-xs mb-3 text-white">Follow Us</h5>
              <div className="flex items-center gap-2">
                {[
                  { href: "https://facebook.com", Icon: Facebook },
                  { href: "https://twitter.com", Icon: Twitter },
                  { href: "https://linkedin.com", Icon: Linkedin },
                  { href: "https://instagram.com", Icon: Instagram },
                ].map(({ href, Icon }) => (
                  <Button
                    key={href}
                    size="icon"
                    variant="outline"
                    className="h-9 w-9 rounded-lg bg-white/10 border-white/20 text-white/70 hover:bg-highlight hover:text-highlight-foreground hover:border-highlight transition-all duration-200"
                    asChild
                  >
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      <Icon className="h-4 w-4" />
                    </a>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <Separator className="my-6 bg-white/10" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/50">
            &copy; {new Date().getFullYear()} Nurse Care Pro. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            {[
              { href: "/privacy", label: "Privacy Policy" },
              { href: "/terms", label: "Terms of Service" },
              { href: "/cookies", label: "Cookie Policy" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-xs text-white/50 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
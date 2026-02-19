import Link from "next/link";
import Image from "next/image";
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";

export function Footer() {
  return (
    <footer className="footer-background border-t border-[var(--border)] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 lg:gap-6">
          {/* Brand & Description */}
          <div className="lg:col-span-5">
            <div className="mb-3 -ml-4">
              <Image
                src="/logo.png"
                alt="Nurse Care Pro"
                width={200}
                height={80}
                className="h-20 w-auto object-contain object-left"
                unoptimized
              />
            </div>
            <p className="text-sm text-gray-700 leading-relaxed max-w-md mb-4">
              Empowering nurses to find their next opportunity. Register your
              profile, upload your resume, and get matched with positions
              locally and internationally.
            </p>

            {/* Newsletter */}
            <div className="mt-4 pt-4 border-t border-[var(--border)]">
              <h5 className="font-semibold text-xs mb-1.5 text-gray-900">Stay Updated</h5>
              <p className="text-xs text-gray-700 mb-2">
                Get job opportunities & career tips
              </p>
              <div className="flex flex-col sm:flex-row gap-1.5">
                <Input
                  type="email"
                  placeholder="Your email"
                  className="h-8 text-xs flex-1 bg-white border-[var(--input)] focus:border-[var(--primary)] focus:ring-[var(--primary)]"
                />
                <Button className="h-8 px-4 font-medium text-xs text-white shadow-sm transition-all duration-200 hover:scale-105 btn-primary-green">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-sm mb-4 text-gray-900 uppercase tracking-wide">Platform</h4>
            <ul className="space-y-2.5">
              {[
                { href: "/dashboard", label: "Dashboard" },
                { href: "/jobs", label: "Job Matches" },
                { href: "/profile", label: "My Profile" },
                { href: "/certifications", label: "Certifications" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="lg:col-span-2">
            <h4 className="font-semibold text-sm mb-3 text-gray-900">Resources</h4>
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
                    className="text-sm text-gray-700 hover:text-gray-900 transition-colors inline-flex items-center gap-1 group"
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="h-3 w-3 opacity-0 -ml-1 group-hover:opacity-100 group-hover:ml-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="lg:col-span-3">
            <h4 className="font-semibold text-sm mb-3 text-gray-900">Contact Us</h4>
            <ul className="space-y-2.5 mb-5">
              <li className="flex items-start gap-3 group">
                <div className="section-icon mt-0.5 flex-shrink-0">
                  <Mail className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-700 mb-0.5">Email</p>
                  <a href="mailto:support@nursecarepro.com" className="text-sm text-gray-900 hover:text-primary transition-colors">
                    support@nursecarepro.com
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="section-icon mt-0.5 flex-shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-700 mb-0.5">Phone</p>
                  <a href="tel:+6328888000" className="text-sm text-gray-900 hover:text-primary transition-colors">
                    +63 (2) 8888-0000
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-3 group">
                <div className="section-icon mt-0.5 flex-shrink-0">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-gray-700 mb-0.5">Location</p>
                  <p className="text-sm text-gray-900">Manila, Philippines</p>
                </div>
              </li>
            </ul>

            {/* Social Links */}
            <div>
              <h5 className="font-semibold text-xs mb-3 text-gray-900">Follow Us</h5>
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
                    className="h-9 w-9 rounded-lg border-border text-gray-500 hover:bg-[#f7c296] hover:text-white hover:border-[#f97316] transition-all duration-200"
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

        <Separator className="my-6" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/90">
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
                className="text-xs text-white/90 hover:text-white transition-colors"
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
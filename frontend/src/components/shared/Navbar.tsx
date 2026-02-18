"use client";

import { useAuth, type AuthUser } from "@/lib/auth-context";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import {
  LogOut,
  Users,
  Settings,
  Stethoscope,
  ClipboardCheck,
  Hospital,
  Calendar,
  Activity,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NovuNotificationBell } from "@/components/shared/NotificationBell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { LucideIcon } from "lucide-react";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
};

const NURSE_LINKS: NavLink[] = [
  { href: "/dashboard", label: "Dashboard", icon: Activity },
  { href: "/profile", label: "Profile", icon: Stethoscope },
  { href: "/jobs", label: "Job Matches", icon: ClipboardCheck },
];

const ADMIN_LINKS: NavLink[] = [
  { href: "/admin", label: "Overview", icon: Hospital },
  { href: "/admin/nurses", label: "Nurses", icon: Users },
  { href: "/admin/jobs", label: "Jobs", icon: Calendar },
];

function Logo({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center group">
      {/* Full Logo with white shadow */}
      <div className="relative group-hover:scale-105 transition-transform">
        <Image
          src="/logo.png"
          alt="Nurse Care Pro"
          width={220}
          height={60}
          className="h-12 w-auto object-contain"
          style={{
            filter: 'drop-shadow(0 2px 4px rgba(255, 255, 255, 0.9))'
          }}
          priority
          unoptimized
        />
      </div>
    </Link>
  );
}

function NavLinks({ links, pathname }: { links: NavLink[]; pathname: string }) {
  return (
    <div className="hidden md:flex items-center gap-1 bg-white/5 backdrop-blur-sm rounded-2xl p-1 border border-white/10">
      {links.map((link) => {
        const isActive = pathname === link.href;
        const Icon = link.icon;
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              isActive
                ? "bg-white/30 text-white shadow-lg border border-white/30"
                : "text-white/90 hover:text-white hover:bg-white/10"
            )}
          >
            <Icon className="h-4 w-4" />
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

function UserMenu({
  user,
  isAdmin,
  userName,
  initials,
  profilePictureUrl,
  userMenuOpen,
  setUserMenuOpen,
  menuRef,
  onSignOut,
}: {
  user: AuthUser;
  isAdmin: boolean;
  userName: string;
  initials: string;
  profilePictureUrl?: string;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onSignOut: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setUserMenuOpen(!userMenuOpen)}
        className="relative"
      >
        <Avatar className="h-11 w-11 border-2 border-white/40 shadow-lg cursor-pointer hover:border-white/60 transition-all">
          {profilePictureUrl ? (
            <>
              <AvatarImage
                src={profilePictureUrl}
                alt={userName}
                className="object-cover"
                onLoad={() => setImageLoaded(true)}
              />
              {!imageLoaded && (
                <AvatarFallback className="bg-white/30 backdrop-blur-lg text-white text-base font-bold">
                  {initials}
                </AvatarFallback>
              )}
            </>
          ) : (
            <AvatarFallback className="bg-white/30 backdrop-blur-lg text-white text-base font-bold">
              {initials}
            </AvatarFallback>
          )}
        </Avatar>
      </button>

      {userMenuOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border shadow-xl py-1 z-50">
          <div className="px-4 py-3 border-b">
            <p className="text-sm font-semibold text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500 truncate">{user.email}</p>
          </div>

          <>
            <Link
              href="/profile"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <User className="h-4 w-4" />
              {isAdmin ? "Profile" : "My Profile"}
            </Link>
            <Link
              href="/settings"
              onClick={() => setUserMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </>

          <button
            onClick={onSignOut}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full border-t mt-1"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}

function MobileNav({
  links,
  pathname,
  isAdmin,
  userName,
  initials,
  profilePictureUrl,
  user,
  userMenuOpen,
  setUserMenuOpen,
  menuRef,
  onSignOut,
}: {
  links: NavLink[];
  pathname: string;
  isAdmin: boolean;
  userName: string;
  initials: string;
  profilePictureUrl?: string;
  user: AuthUser;
  userMenuOpen: boolean;
  setUserMenuOpen: (open: boolean) => void;
  menuRef: React.RefObject<HTMLDivElement | null>;
  onSignOut: () => void;
}) {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-primary/95 backdrop-blur-xl border-t border-white/20 shadow-2xl safe-bottom">
      <div className="flex items-center justify-around px-2 py-2">
        {links.map((link) => {
          const isActive = pathname === link.href;
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center justify-center p-3 rounded-xl transition-all",
                isActive
                  ? "text-white bg-white/30"
                  : "text-white/70 hover:text-white hover:bg-white/10"
              )}
            >
              <Icon className="h-6 w-6" />
            </Link>
          );
        })}

        <div ref={menuRef} className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className={cn(
              "flex items-center justify-center p-2 rounded-xl transition-all",
              userMenuOpen
                ? "text-white bg-white/30"
                : "text-white/70 hover:text-white hover:bg-white/10"
            )}
          >
            <Avatar className="h-10 w-10 border-2 border-white/40">
              {profilePictureUrl && (
                <AvatarImage
                  src={profilePictureUrl}
                  alt={userName}
                  className="object-cover"
                />
              )}
              <AvatarFallback className="bg-white/30 text-white text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          {userMenuOpen && (
            <div className="absolute bottom-full right-0 mb-2 w-56 bg-white rounded-xl border shadow-xl py-1 z-50">
              <div className="px-4 py-3 border-b">
                <p className="text-sm font-semibold text-gray-900">{userName}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>

              <>
                <Link
                  href="/profile"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <User className="h-4 w-4" />
                  {isAdmin ? "Profile" : "My Profile"}
                </Link>
                <Link
                  href="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </>

              <button
                onClick={onSignOut}
                className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 w-full border-t mt-1"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function Navbar() {
  const { user, status, logout } = useAuth();
  const pathname = usePathname();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navClasses = cn(
    "sticky top-0 inset-x-0 z-50 transition-all duration-500",
    scrolled
      ? "bg-primary backdrop-blur-xl border-b border-white/20 shadow-2xl"
      : "bg-primary/95 backdrop-blur-lg border-b border-white/10 shadow-lg"
  );

  if (status === "loading") {
    return (
      <nav className={navClasses}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="h-12 w-48 rounded-lg bg-white/20 animate-pulse" />
            </div>
          </div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className={navClasses}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center group">
              {/* Full Logo with white shadow */}
              <div className="relative group-hover:scale-105 transition-transform">
                <Image
                  src="/logo.png"
                  alt="Nurse Care Pro"
                  width={220}
                  height={60}
                  className="h-12 w-auto object-contain"
                  priority
                  unoptimized
                />
              </div>
            </Link>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full h-10 px-10 font-semibold text-white gradient-primary hover:text-black hover:brightness-125 transition-all duration-300">
                  Sign In
                </Button>
              </Link>

              <Link href="/register">
                <Button size="sm" className="h-10 px-10 font-semibold bg-white text-primary hover:bg-white/95 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 group">
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const isAdmin = user.role === "admin";
  const emailUsername = user.email?.split("@")[0] || "User";
  const derivedFirstName = emailUsername.split(/[._-]/)[0].charAt(0).toUpperCase() + emailUsername.split(/[._-]/)[0].slice(1).toLowerCase();
  const firstName = user.firstName || derivedFirstName;
  const lastName = user.lastName || "";
  const userName = lastName ? `${firstName} ${lastName}` : firstName;
  const initials = userName.split(' ').map(word => word.charAt(0)).join('').slice(0, 2).toUpperCase();
  const profilePictureUrl = user.profilePictureUrl;
  const links = isAdmin ? ADMIN_LINKS : NURSE_LINKS;

  return (
    <>
      <nav className={navClasses}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16">
            <Logo isAdmin={isAdmin} />
            <NavLinks links={links} pathname={pathname} />

            <div className="flex items-center gap-3">
              <NovuNotificationBell />
              <div className="hidden md:block">
                <UserMenu
                  user={user}
                  isAdmin={isAdmin}
                  userName={userName}
                  initials={initials}
                  profilePictureUrl={profilePictureUrl}
                  userMenuOpen={userMenuOpen}
                  setUserMenuOpen={setUserMenuOpen}
                  menuRef={menuRef}
                  onSignOut={logout}
                />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <MobileNav
        links={links}
        pathname={pathname}
        isAdmin={isAdmin}
        userName={userName}
        initials={initials}
        profilePictureUrl={profilePictureUrl}
        user={user}
        userMenuOpen={mobileMenuOpen}
        setUserMenuOpen={setMobileMenuOpen}
        menuRef={mobileMenuRef}
        onSignOut={logout}
      />
    </>
  );
}
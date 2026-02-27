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

const dropdownMenuClasses = "absolute w-56 bg-card rounded-xl border border-border shadow-xl py-1 z-50";
const dropdownHeaderClasses = "px-4 py-3 border-b border-border";
const dropdownLinkClasses = "flex items-center gap-2 px-4 py-2 text-sm text-foreground hover:bg-secondary transition-colors";
const dropdownSignOutClasses = "flex items-center gap-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full border-t border-border mt-1 transition-colors";

function DropdownMenu({
  user,
  isAdmin,
  userName,
  position,
  onClose,
  onSignOut,
}: {
  user: AuthUser;
  isAdmin: boolean;
  userName: string;
  position: "top" | "bottom";
  onClose: () => void;
  onSignOut: () => void;
}) {
  return (
    <div
      className={cn(
        dropdownMenuClasses,
        position === "bottom" ? "right-0 top-full mt-2" : "bottom-full right-0 mb-2"
      )}
    >
      <div className={dropdownHeaderClasses}>
        <p className="text-sm font-semibold text-foreground">{userName}</p>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
      </div>
      <Link href="/profile" onClick={onClose} className={dropdownLinkClasses}>
        <User className="h-4 w-4" />
        {isAdmin ? "Profile" : "My Profile"}
      </Link>
      <Link href="/settings" onClick={onClose} className={dropdownLinkClasses}>
        <Settings className="h-4 w-4" />
        Settings
      </Link>
      <button onClick={onSignOut} className={dropdownSignOutClasses}>
        <LogOut className="h-4 w-4" />
        Sign Out
      </button>
    </div>
  );
}

function Logo({ isAdmin }: { isAdmin: boolean }) {
  return (
    <Link href={isAdmin ? "/admin" : "/dashboard"} className="flex items-center group">
      <div className="relative">
        <div className="absolute inset-0 bg-cyan-400/25 blur-xl rounded-full group-hover:bg-cyan-400/40 transition-all duration-300" />
        <Image
          src="/logo.png"
          alt="Nurse Care Pro"
          width={220}
          height={60}
          className="h-12 w-auto object-contain relative drop-shadow-[0_0_1px_rgba(2,150,180,0.7)] group-hover:drop-shadow-[0_0_2px_rgba(2,150,180,1),0_0_12px_rgba(6,182,212,0.9)] transition-all duration-300"
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
      <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="relative">
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
        <DropdownMenu
          user={user}
          isAdmin={isAdmin}
          userName={userName}
          position="bottom"
          onClose={() => setUserMenuOpen(false)}
          onSignOut={onSignOut}
        />
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
    <div
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 backdrop-blur-xl border-t border-white/20 shadow-2xl safe-bottom"
      style={{ background: "linear-gradient(135deg, var(--admin-hero-from) 0%, var(--admin-hero-via-1) 40%, var(--admin-hero-via-2) 70%, var(--admin-hero-to) 100%)" }}
    >
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
                <AvatarImage src={profilePictureUrl} alt={userName} className="object-cover" />
              )}
              <AvatarFallback className="bg-white/30 text-white text-sm font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
          </button>

          {userMenuOpen && (
            <DropdownMenu
              user={user}
              isAdmin={isAdmin}
              userName={userName}
              position="top"
              onClose={() => setUserMenuOpen(false)}
              onSignOut={onSignOut}
            />
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

  const heroGradient = "linear-gradient(135deg, var(--admin-hero-from) 0%, var(--admin-hero-via-1) 40%, var(--admin-hero-via-2) 70%, var(--admin-hero-to) 100%)";

  const navClasses = cn(
    "sticky top-0 inset-x-0 z-50 transition-all duration-500 drop-shadow-[0_0_15px_rgba(6,182,212,0.15)]",
    scrolled
      ? "backdrop-blur-xl border-b border-white/20 shadow-2xl"
      : "backdrop-blur-lg border-b border-white/10 shadow-lg"
  );

  if (status === "loading") {
    return (
      <nav className={navClasses} style={{ background: heroGradient }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="h-12 w-48 rounded-lg bg-white/20 animate-pulse" />
          </div>
        </div>
      </nav>
    );
  }

  if (!user) {
    return (
      <nav className={navClasses} style={{ background: heroGradient }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center group">
              <div className="relative">
                <div className="absolute inset-0 bg-cyan-400/25 blur-xl rounded-full group-hover:bg-cyan-400/40 transition-all duration-300" />
                <Image
                  src="/logo.png"
                  alt="Nurse Care Pro"
                  width={220}
                  height={60}
                  className="h-12 w-auto object-contain relative drop-shadow-[0_0_10px_rgba(6,182,212,0.8)] group-hover:drop-shadow-[0_0_18px_rgba(6,182,212,1)] transition-all duration-300"
                  priority
                  unoptimized
                />
              </div>
            </Link>
            <div className="flex items-center">
              <Link href="/login">
                <Button
                  size="sm"
                  className="h-10 px-8 font-semibold shadow-lg transition-all duration-300 hover:scale-105 btn-highlight"
                >
                  Get Started
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
    );
  }

  const isAdmin = user.role === "admin" || user.role === "superadmin";
  const emailUsername = user.email?.split("@")[0] || "User";
  const derivedFirstName =
    emailUsername.split(/[._-]/)[0].charAt(0).toUpperCase() +
    emailUsername.split(/[._-]/)[0].slice(1).toLowerCase();
  const firstName = user.firstName || derivedFirstName;
  const lastName = user.lastName || "";
  const userName = lastName ? `${firstName} ${lastName}` : firstName;
  const initials = userName.split(" ").map((w) => w.charAt(0)).join("").slice(0, 2).toUpperCase();
  const profilePictureUrl = user.profilePictureUrl;

  const links = [...(isAdmin ? ADMIN_LINKS : NURSE_LINKS)];
  if (user.role === "superadmin") {
    links.push({ href: "/admin/staff", label: "Staff", icon: Users });
  }

  return (
    <>
      <nav className={navClasses} style={{ background: heroGradient }}>
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
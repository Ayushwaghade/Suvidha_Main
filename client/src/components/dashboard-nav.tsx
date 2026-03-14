"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { CalendarDays, User, ShieldCheck, Briefcase } from "lucide-react"; // <-- Added Briefcase here

export function DashboardNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const navItems = [
    {
      href: "/dashboard/bookings",
      label: "My Bookings",
      icon: CalendarDays,
    },
    {
      href: "/jobs", // <-- NEW: Link to our new Job Board!
      label: "Job Board",
      icon: Briefcase,
    },
    {
      href: "/dashboard/profile",
      label: "Profile Settings",
      icon: User,
    },
  ];

  if (user?.role === "provider") {
    navItems.push({
      href: "/dashboard/verify-trust",
      label: "Trust Verification",
      icon: ShieldCheck,
    });
  }

  return (
    <nav className="flex flex-col gap-2">
      {navItems.map((item) => (
        <Button
          key={item.href}
          variant="ghost"
          asChild
          className={cn(
            "justify-start",
            pathname === item.href
              ? "bg-accent text-accent-foreground hover:bg-accent/90"
              : "hover:bg-muted"
          )}
        >
          <Link href={item.href}>
            <item.icon className="mr-2 h-4 w-4" />
            {item.label}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
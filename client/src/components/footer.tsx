"use client";

export function Footer() {
  return (
    <footer className="bg-card/50 border-t mt-16">
      <div className="container mx-auto px-4 py-6 text-center text-sm text-muted-foreground">
        &copy; {new Date().getFullYear()} SuvidhaConnect. Your trusted partner for home services.
      </div>
    </footer>
  );
}

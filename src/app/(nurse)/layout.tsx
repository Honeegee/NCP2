import { Navbar } from "@/components/shared/Navbar";
import { Footer } from "@/components/shared/Footer";

export default function NurseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex-1 bg-muted/30 flex flex-col overflow-x-clip">
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8 md:px-12 w-full flex-1 pb-20 md:pb-0">{children}</main>
      <Footer />
    </div>
  );
}

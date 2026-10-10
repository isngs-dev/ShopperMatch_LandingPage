import { Logo } from "@/components/Navbar";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/10 bg-[#170d07]/80 px-5 py-10 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-center text-sm text-[#cdb88f] md:flex-row md:text-left">
        <div className="flex flex-col items-center gap-1 md:items-start">
          <Logo />
          <p>A product by iSN</p>
        </div>
        <p>© 2026 iSN. All rights reserved.</p>
      </div>
    </footer>
  );
}

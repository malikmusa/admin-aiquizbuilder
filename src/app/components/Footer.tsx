import Link from "next/link";

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-[#0c4a6e] text-white" role="contentinfo">
      {/* Top: columns */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3">
              <img src="/fav.png" height={60} width={60} alt="Logo" className="object-contain" />
              <div>
                <p className="text-base font-bold leading-tight">AI Quiz Builder</p>
                <p className="text-sm text-white/80 leading-tight">
                  Free AI quiz builder — create an awesome quiz in minutes
                </p>
              </div>
            </div>
            <p className="mt-4 text-sm text-white/80 max-w-md">
              Build and share quizzes fast. AI-powered generation, lead capture, and embeddable widgets.
            </p>
          </div>

          {/* Product */}
          <nav aria-label="Product">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-white/70">Product</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-[#f5773a] transition-colors" href="/generate">Create Quiz</Link></li>
              <li><Link className="hover:text-[#f5773a] transition-colors" href="/quizzes">Your Quizzes</Link></li>
              <li><Link className="hover:text-[#f5773a] transition-colors" href="/use-cases/education">Education</Link></li>
              <li><Link className="hover:text-[#f5773a] transition-colors" href="/use-cases/training">Training</Link></li>
              <li><Link className="hover:text-[#f5773a] transition-colors" href="/use-cases/marketing">Marketing</Link></li>
            </ul>
          </nav>

          {/* Company */}
          <nav aria-label="Company">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-white/70">Company</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-[#f5773a]" href="/about">About</Link></li>
              <li><Link className="hover:text-[#f5773a]" href="/contact">Contact</Link></li>
              <li><Link className="hover:text-[#f5773a]" href="/accessibility">Accessibility</Link></li>
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <h3 className="text-xs font-semibold tracking-wider uppercase text-white/70">Legal</h3>
            <ul className="mt-3 space-y-2 text-sm">
              <li><Link className="hover:text-[#f5773a]" href="/privacy">Privacy Policy</Link></li>
              <li><Link className="hover:text-[#f5773a]" href="/terms">Terms of Service</Link></li>
              <li><Link className="hover:text-[#f5773a]" href="/refund">Refund Policy</Link></li>
              <li><Link className="hover:text-[#f5773a]" href="/cookies">Cookie Policy</Link></li>
              <li>
                <button
                  type="button"
                  id="open-cookie-settings"
                  className="hover:text-[#f5773a] transition-colors"
                  aria-label="Open cookie settings"
                >
                  Cookie Settings
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom: divider, social, copyright */}
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Social */}
          <div className="flex items-center gap-4">
            <a href="https://twitter.com" aria-label="Twitter" className="text-white/80 hover:text-white">
              <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.633 7.997c.013.18.013.36.013.54 0 5.49-4.18 11.82-11.82 11.82-2.35 0-4.53-.69-6.37-1.88.33.04.65.05.99.05 1.95 0 3.75-.66 5.18-1.78a4.16 4.16 0 01-3.88-2.88c.25.04.5.07.76.07.37 0 .73-.05 1.07-.15a4.15 4.15 0 01-3.33-4.07v-.05c.55.31 1.18.5 1.85.52A4.14 4.14 0 012.8 6.3c0-.76.2-1.47.55-2.08a11.79 11.79 0 008.56 4.34 4.68 4.68 0 01-.1-.95 4.14 4.14 0 017.16-2.83 8.14 8.14 0 002.63-1 4.17 4.17 0 01-1.82 2.29 8.3 8.3 0 002.38-.65 8.94 8.94 0 01-2.13 2.25z"/>
              </svg>
            </a>
            <a href="https://github.com" aria-label="GitHub" className="text-white/80 hover:text-white">
              <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path fillRule="evenodd" d="M12 .5a12 12 0 00-3.79 23.39c.6.11.82-.26.82-.58v-2.18c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.1-.75.08-.74.08-.74 1.22.09 1.86 1.26 1.86 1.26 1.08 1.85 2.83 1.32 3.53 1.01.11-.79.42-1.32.76-1.63-2.66-.3-5.46-1.33-5.46-5.92 0-1.31.47-2.38 1.24-3.22-.12-.3-.54-1.53.12-3.19 0 0 1.01-.32 3.31 1.23a11.5 11.5 0 016.02 0c2.3-1.55 3.31-1.23 3.31-1.23.66 1.66.24 2.89.12 3.19.77.84 1.24 1.91 1.24 3.22 0 4.6-2.8 5.61-5.47 5.91.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.58A12 12 0 0012 .5z" clipRule="evenodd"/>
              </svg>
            </a>
            <a href="mailto:musa@aiquizbuilder.com" aria-label="Email" className="text-white/80 hover:text-white">
              <svg aria-hidden="true" className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M2.25 6.75A2.25 2.25 0 014.5 4.5h15a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0119.5 19.5h-15A2.25 2.25 0 012.25 17.25V6.75zm2.4-.75l7.35 5.25L19.35 6h-14.7zm15.9 1.98l-6.96 4.97a2.25 2.25 0 01-2.58 0L4.05 7.98v9.27c0 .414.336.75.75.75h13.8a.75.75 0 00.75-.75V7.98z"/>
              </svg>
            </a>
          </div>

          {/* Copyright / links */}
          <div className="text-xs text-white/70">
            © {year} Quiz Maker. All rights reserved.
          </div>

          {/* Back to top */}
          <div>
            <a href="#top" className="text-xs text-white/80 hover:text-white underline underline-offset-2">
              Back to top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

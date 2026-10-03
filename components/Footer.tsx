import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-orange-200 bg-orange-50 mt-10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
        <div>
          <h4 className="font-semibold mb-2 text-orange-600">StayNestly</h4>
          <p className="text-slate-700">Find great deals on hotels and stays around the world.</p>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-slate-900">Explore</h4>
          <ul className="space-y-1 text-slate-700">
            <li><Link className="hover:text-orange-600 transition" href="/search?city=Goa">Goa</Link></li>
            <li><Link className="hover:text-orange-600 transition" href="/search?city=Delhi">Delhi</Link></li>
            <li><Link className="hover:text-orange-600 transition" href="/search?city=Mumbai">Mumbai</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-slate-900">Company</h4>
          <ul className="space-y-1 text-slate-700">
            <li><Link className="hover:text-orange-600 transition" href="/">About</Link></li>
            <li><Link className="hover:text-orange-600 transition" href="/">Careers</Link></li>
            <li><Link className="hover:text-orange-600 transition" href="/">Press</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2 text-slate-900">Support</h4>
          <ul className="space-y-1 text-slate-700">
            {/* UPDATED LINKS TO MAIN PAGE */}
            <li><Link className="hover:text-orange-600 transition" href="/">Contact Us</Link></li>
            <li><Link className="hover:text-orange-600 transition" href="/">Privacy Policy</Link></li>
            <li><Link className="hover:text-orange-600 transition" href="/">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-orange-200">
        <div className="max-w-6xl mx-auto px-4 py-4 text-xs text-slate-600 flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© {new Date().getFullYear()} StayNestly. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="/" className="hover:text-orange-600 transition">Twitter</Link>
            <Link href="/" className="hover:text-orange-600 transition">Instagram</Link>
            <Link href="/" className="hover:text-orange-600 transition">Facebook</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
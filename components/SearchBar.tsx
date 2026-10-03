"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function SearchBar({ dense = false }: { dense?: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [city, setCity] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(1);

  useEffect(() => {
    setCity(params.get('city') || '');
    setCheckIn(params.get('checkIn') || '');
    setCheckOut(params.get('checkOut') || '');
    setGuests(Number(params.get('guests') || 1));
  }, [params]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const sp = new URLSearchParams({
      city: city || '',
      checkIn,
      checkOut,
      guests: String(guests || 1),
    });
    router.push(`/search?${sp.toString()}`);
  }

  return (
    <form onSubmit={onSubmit} className={`${dense ? 'p-2' : 'p-3'} bg-white rounded-xl shadow-md grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-3 items-center`}>
      <div className="relative">
        <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Where are you going?" className="border rounded-lg p-3 w-full text-black placeholder:text-black pr-10" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">📍</span>
      </div>
      <div className="relative">
        <input type="date" value={checkIn} onChange={(e) => setCheckIn(e.target.value)} className="border rounded-lg p-3 w-full text-black placeholder:text-black pr-10" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700">📅</span>
      </div>
      <div className="relative">
        <input type="date" value={checkOut} onChange={(e) => setCheckOut(e.target.value)} className="border rounded-lg p-3 w-full text-black placeholder:text-black pr-10" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700">📅</span>
      </div>
      <div className="relative">
        <input type="number" min={1} value={guests} onChange={(e) => setGuests(parseInt(e.target.value))} className="border rounded-lg p-3 w-full text-black placeholder:text-black pr-10" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-700">👤</span>
      </div>
      <button className="bg-primary text-white rounded-lg px-5 py-3 w-full md:w-auto">Search</button>
    </form>
  );
}

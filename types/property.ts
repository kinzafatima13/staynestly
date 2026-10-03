// types/property.ts

export interface Property {
  id: string;
  title: string;
  city: string;
  price: number;
  rating: number;
  images?: string[];
  lat: number; // Required for location
  lng: number; // Required for location
  description?: string;
  bedrooms?: number;
  bathrooms?: number;
  maxGuests?: number;
  hostId?: string;
  createdAt?: Date;
  updatedAt?: Date;
  available?: boolean;
  featured?: boolean;
}
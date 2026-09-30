// lib/location.ts
//
// Location store — persisted to localStorage.
// Hardcoded list of saved locations (replaced with user addresses later).

const STORAGE_KEY = "swiggy_location_id";
const CHANGE_EVENT = "swiggy-location-changed";

export interface SavedLocation {
  id: string;
  label: string;
  address: string;
}

export const SAVED_LOCATIONS: SavedLocation[] = [
  {
    id: "jubilee-hills",
    label: "Jubilee Hills",
    address: "Road No. 36, Hyderabad",
  },
  {
    id: "banjara-hills",
    label: "Banjara Hills",
    address: "Road No. 12, Hyderabad",
  },
  {
    id: "gachibowli",
    label: "Gachibowli",
    address: "Financial District, Hyderabad",
  },
  {
    id: "madhapur",
    label: "Madhapur",
    address: "Hitec City, Hyderabad",
  },
];

const DEFAULT_ID = SAVED_LOCATIONS[0].id;

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

export function subscribe(cb: () => void): () => void {
  if (!isBrowser()) return () => {};
  window.addEventListener("storage", cb);
  window.addEventListener(CHANGE_EVENT, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(CHANGE_EVENT, cb);
  };
}

export function getCurrentLocation(): SavedLocation {
  if (!isBrowser()) return SAVED_LOCATIONS[0];
  const id = localStorage.getItem(STORAGE_KEY) ?? DEFAULT_ID;
  return SAVED_LOCATIONS.find((l) => l.id === id) ?? SAVED_LOCATIONS[0];
}

export function getServerLocation(): SavedLocation {
  return SAVED_LOCATIONS[0];
}

export function setCurrentLocation(id: string): void {
  if (!isBrowser()) return;
  const valid = SAVED_LOCATIONS.some((l) => l.id === id);
  if (!valid) return;
  localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new Event(CHANGE_EVENT));
}
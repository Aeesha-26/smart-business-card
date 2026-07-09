/**
 * In-app phonebook stored in localStorage.
 * Allows visitors to save contacts to CardSync's own phonebook
 * without downloading a file to the device.
 */

export interface SavedContact {
  id: string;           // card id (unique per contact)
  name: string;
  job_title?: string | null;
  organization?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  linkedin_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  avatar_url?: string | null;
  savedAt: string;      // ISO timestamp
}

const STORAGE_KEY = "cardsync_phonebook";

export function getPhonebook(): SavedContact[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedContact[]) : [];
  } catch {
    return [];
  }
}

export function isContactSaved(cardId: string): boolean {
  return getPhonebook().some((c) => c.id === cardId);
}

export function saveToPhonebook(contact: Omit<SavedContact, "savedAt">): void {
  const book = getPhonebook().filter((c) => c.id !== contact.id); // deduplicate
  book.unshift({ ...contact, savedAt: new Date().toISOString() });
  localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
}

export function removeFromPhonebook(cardId: string): void {
  const book = getPhonebook().filter((c) => c.id !== cardId);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(book));
}

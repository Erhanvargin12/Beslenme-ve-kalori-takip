import type { UserHistory, Durum, SortField, SortOrder } from "../types/history";

// Arama Filtresi (İsme, boy ve kiloya göre arama)
export function filterBySearch(users: UserHistory[], query: string): UserHistory[] {
  if (!query.trim()) return users;

  const lower = query.toLowerCase();
  return users.filter(
    (u) =>
      u.isim.toLowerCase().includes(lower) ||
      u.boy.toString().includes(lower) ||
      u.kilo.toString().includes(lower) ||
      u.vki.toString().includes(lower)
  );
}

// Durum / Kategori Filtresi
export function filterByDurum(users: UserHistory[], durum: Durum | "all"): UserHistory[] {
  if (durum === "all") return users;
  return users.filter((u) => u.durum === durum);
}

// Siralama 
export function sortUsers(
  users: UserHistory[],
  field: SortField,
  order: SortOrder
): UserHistory[] {
  const sorted = [...users].sort((a, b) => {
    if (field === "vki") {
      return a.vki - b.vki;
    }
    // "isim" siralama durumu
    return a.isim.localeCompare(b.isim, "tr");
  });

  return order === "desc" ? sorted.reverse() : sorted;
}

// Ana Filtre Birlestirme Yoneticisi
export function applyFilters(
  users: UserHistory[],
  search: string,
  durum: Durum | "all",
  sortField: SortField,
  sortOrder: SortOrder
): UserHistory[] {
  let result = filterBySearch(users, search);
  result = filterByDurum(result, durum);
  result = sortUsers(result, sortField, sortOrder);
  return result;
}

// Kategori / Durum Tipleri
export type Durum = "Zayıf" | "Normal" | "Fazla Kilolu" | "Obez" | "Bilinmiyor";

// Siralama secenekleri
export type SortField = "isim" | "vki";
export type SortOrder = "asc" | "desc";

// Kullanıcı Kayıt Veri Modeli
export interface UserHistory {
  id: string;
  authId?: string;
  isim: string;
  boy: number;
  kilo: number;
  vki: number;
  durum: Durum;
}

// Filtre Durumu
export interface FilterState {
  search: string;
  durum: Durum | "all";
  sortField: SortField;
  sortOrder: SortOrder;
}

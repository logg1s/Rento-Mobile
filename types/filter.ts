export type SortOption =
  | "price_asc"
  | "price_desc"
  | "rating"
  | "newest"
  | null;

export type FilterType = {
  priceRange: {
    min: number;
    max: number;
  };
  ratings: number[];
  categories: number[];
  location: string | null;
  sortBy: SortOption;
};

export const defaultFilters: FilterType = {
  priceRange: {
    min: 0,
    max: 10000000,
  },
  ratings: [],
  categories: [],
  location: null,
  sortBy: null,
};

export const allCategoriesOption = {
  id: -1,
  category_name: "Tất cả thể loại",
  image_id: "all",
  created_at: "",
  updated_at: "",
  deleted_at: null,
};

interface ParentCategoriesDto {
  categoryId: number;
  categoryName: string;
  children: ParentCategoriesDto[];
}

export interface CategorySelectorProps {
  categories: ParentCategoriesDto[];
  selectedCategoryId: number | null;
  onSelectCategory: (categoryId: number, categoryName: string) => void;
}

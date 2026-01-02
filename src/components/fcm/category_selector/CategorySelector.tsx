import { useState } from "react";
import type { CategorySelectorProps } from "./CategorySelectorDto";
import { ChevronRight } from "lucide-react";

const CategorySelector: React.FC<CategorySelectorProps> = ({
  categories,
  selectedCategoryId,
  onSelectCategory,
}) => {
  const [hoveredParentId, setHoveredParentId] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const selectedCategory = categories
    .flatMap((parent) => [parent, ...parent.children])
    .find((cat) => cat.categoryId === selectedCategoryId);

  return (
    <div className="relative">
      {/* 선택된 카테고리 표시 */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white text-left flex items-center justify-between"
      >
        <span className={selectedCategory ? "text-gray-900" : "text-gray-400"}>
          {selectedCategory?.categoryName || "선택하세요"}
        </span>
        <ChevronRight
          className={`transition-transform ${isOpen ? "rotate-90" : ""}`}
          size={20}
        />
      </button>

      {/* 드롭다운 메뉴 */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg overflow-hidden">
            <div className="flex">
              {/* 부모 카테고리 목록 */}
              <div className="w-1/2 border-r border-gray-200">
                {categories.map((parent) => (
                  <div
                    key={parent.categoryId}
                    className="relative"
                    onMouseEnter={() => setHoveredParentId(parent.categoryId)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onSelectCategory(
                          parent.categoryId,
                          parent.categoryName
                        );
                        setIsOpen(false);
                        setHoveredParentId(null);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-purple-50 transition-colors flex items-center justify-between ${
                        hoveredParentId === parent.categoryId
                          ? "bg-purple-50"
                          : ""
                      } ${
                        selectedCategoryId === parent.categoryId
                          ? "bg-purple-100 font-semibold"
                          : ""
                      }`}
                    >
                      <span>{parent.categoryName}</span>
                      {parent.children.length > 0 && (
                        <ChevronRight size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                ))}
              </div>

              {/* 자식 카테고리 목록 */}
              <div className="w-1/2 bg-gray-50">
                {hoveredParentId !== null &&
                  categories
                    .find((cat) => cat.categoryId === hoveredParentId)
                    ?.children.map((child) => (
                      <button
                        key={child.categoryId}
                        type="button"
                        onClick={() => {
                          onSelectCategory(
                            child.categoryId,
                            child.categoryName
                          );
                          setIsOpen(false);
                          setHoveredParentId(null);
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-purple-100 transition-colors ${
                          selectedCategoryId === child.categoryId
                            ? "bg-purple-200 font-semibold"
                            : ""
                        }`}
                      >
                        {child.categoryName}
                      </button>
                    ))}
                {hoveredParentId !== null &&
                  categories.find((cat) => cat.categoryId === hoveredParentId)
                    ?.children.length === 0 && (
                    <div className="px-4 py-3 text-gray-400 text-sm">
                      하위 카테고리가 없습니다
                    </div>
                  )}
                {hoveredParentId === null && (
                  <div className="px-4 py-3 text-gray-400 text-sm">
                    카테고리를 선택하세요
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
export default CategorySelector;

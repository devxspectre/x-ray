// Product data for the demo
// These are the products we'll be comparing

export interface Product {
  asin: string;
  title: string;
  price: number;
  rating: number;
  reviews: number;
  category: string;
}

// This is the product we're trying to find competitors for
export const referenceProduct: Product = {
  asin: "B0XYZ123",
  title: "ProBrand Steel Bottle 32oz Insulated",
  price: 29.99,
  rating: 4.2,
  reviews: 1247,
  category: "Sports & Outdoors > Water Bottles"
};

// These are potential competitors we found
export const mockCandidates: Product[] = [
  { asin: "B0COMP01", title: "HydroFlask 32oz Wide Mouth", price: 44.99, rating: 4.5, reviews: 8932, category: "Sports & Outdoors > Water Bottles" },
  { asin: "B0COMP02", title: "Yeti Rambler 26oz", price: 34.99, rating: 4.4, reviews: 5621, category: "Sports & Outdoors > Water Bottles" },
  { asin: "B0COMP03", title: "Generic Water Bottle", price: 8.99, rating: 3.2, reviews: 45, category: "Sports & Outdoors > Water Bottles" },
  { asin: "B0COMP04", title: "Stanley Adventure Quencher", price: 35.00, rating: 4.3, reviews: 4102, category: "Sports & Outdoors > Water Bottles" },
  { asin: "B0COMP05", title: "Replacement Lid for HydroFlask", price: 12.99, rating: 4.6, reviews: 3421, category: "Sports & Outdoors > Parts" },
  { asin: "B0COMP06", title: "Water Bottle Carrier Bag", price: 15.99, rating: 4.1, reviews: 892, category: "Sports & Outdoors > Accessories" },
  { asin: "B0COMP07", title: "Nalgene Wide Mouth 32oz", price: 12.99, rating: 4.6, reviews: 12543, category: "Sports & Outdoors > Water Bottles" },
  { asin: "B0COMP08", title: "CamelBak Chute Mag 32oz", price: 16.00, rating: 4.5, reviews: 7821, category: "Sports & Outdoors > Water Bottles" },
  { asin: "B0COMP09", title: "Premium Titanium Bottle", price: 89.00, rating: 4.8, reviews: 234, category: "Sports & Outdoors > Water Bottles" },
  { asin: "B0COMP10", title: "Contigo Autoseal", price: 14.99, rating: 4.3, reviews: 15632, category: "Sports & Outdoors > Water Bottles" },
];

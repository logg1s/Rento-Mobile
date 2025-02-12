import { ServiceCardProp } from "@/types/type";

export const home_data: ServiceCardProp["data"][] = [
  {
    id: 1,
    name: "Lê Hoàng Cường",
    service: "Sửa điện",
    rating: 4.2,
    priceRange: "250k - 600k / giờ",
    description:
      "Thợ điện được cấp phép với hơn 8 năm kinh nghiệm, chuyên xử lý mọi vấn đề về điện trong gia đình và doanh nghiệp.",
    imageUrl: "https://picsum.photos/200",
    commentCount: 20,
    isLike: true,
  },
  {
    id: 2,
    name: "Nguyen Thi A",
    service: "Dọn dẹp",
    rating: 4.6,
    priceRange: "250k - 600k / giờ",
    description: "Chuyên dọn dẹp với giá cả hợp lí",
    imageUrl: "https://picsum.photos/200",
    commentCount: 100,
    isLike: false,
  },
  {
    id: 3,
    name: "Nguyen Thi A",
    service: "Dọn dẹp",
    rating: 4.6,
    priceRange: "250k - 600k / giờ",
    description: "Chuyên dọn dẹp với giá cả hợp lí",
    imageUrl: "https://picsum.photos/200",
    commentCount: 100,
    isLike: false,
  },
];

export const price_data = [
  {
    id: 1,
    name: "Pro cao cấp",
    price: 50000,
    discount: 15,
    id_benefit: [2, 3, 5],
  },
  {
    id: 2,
    name: "Tiết kiệm 12333333333",
    price: 15000,
    id_benefit: [2, 3, 4],
  },
  {
    id: 5,
    name: "Pro v",
    price: 500000000,
    discount: 15,
    id_benefit: [2, 3, 5],
  },
  {
    id: 6,
    name: "Tiết kiệm mamaamamm max max",
    price: 15000,
    id_benefit: [2, 3, 4],
  },
];

export const benefit_data = [
  { id: 1, name: "Pro cao cấp" },
  { id: 2, name: "Được sửa chữa toàn diện" },
  { id: 3, name: "Tư vấn hiệu quả" },
  { id: 4, name: "Hỗ trợ 24/7" },
  { id: 5, name: "Bảo hành 12 tháng" },
  { id: 6, name: "Pro cao cấp" },
  { id: 7, name: "Được sửa chữa toàn diện" },
  { id: 8, name: "Tư vấn hiệu quả" },
  { id: 9, name: "Hỗ trợ 24/7" },
  { id: 10, name: "Bảo hành 12 tháng" },
];

export const comment_data = [
  {
    id: 1,
    comment: "Good service !!! Good 1222222222222222222222222",
    userId: home_data[0].id,
    rating: 4.6,
  },
  {
    id: 2,
    comment: "Good service !!! Good 1222222222222222222222222",
    userId: home_data[1].id,
    rating: 4.8,
  },
];

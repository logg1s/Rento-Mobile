import type { ServiceCardProp } from "@/types/prop";

export type TimeSlot = {
  id: number;
  time: string;
  isAvailable: boolean;
};

export type DateSlot = {
  date: string;
  isAvailable: boolean;
  timeSlots: TimeSlot[];
};

export type Service = ServiceCardProp["data"] & {
  category: string;
  pricePerHour: number;
  experience: number; // in years
  location: string;
};

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

export const dateSlots: DateSlot[] = Array.from({ length: 30 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() + i);
  return {
    date: date.toISOString().split("T")[0],
    isAvailable: Math.random() > 0.2, // 80% chance of being available
    timeSlots: Array.from({ length: 12 }, (_, j) => ({
      id: i * 100 + j,
      time: `${String(8 + j).padStart(2, "0")}:00`,
      isAvailable: Math.random() > 0.3, // 70% chance of being available
    })),
  };
});

export const services: Service[] = [
  {
    id: 1,
    name: "Lê Hoàng Cường",
    service: "Sửa điện",
    category: "Điện",
    rating: 4.2,
    priceRange: "250k - 600k / giờ",
    pricePerHour: 250000,
    description:
      "Thợ điện được cấp phép với hơn 8 năm kinh nghiệm, chuyên xử lý mọi vấn đề về điện trong gia đình và doanh nghiệp.",
    imageUrl: "https://picsum.photos/200",
    commentCount: 20,
    isLike: true,
    experience: 8,
    location: "Hà Nội",
  },
  {
    id: 2,
    name: "Nguyễn Thị Anh",
    service: "Dọn dẹp nhà cửa",
    category: "Dọn dẹp",
    rating: 4.6,
    priceRange: "200k - 400k / giờ",
    pricePerHour: 200000,
    description:
      "Chuyên dọn dẹp nhà cửa với giá cả hợp lý, sạch sẽ và nhanh chóng.",
    imageUrl: "https://picsum.photos/201",
    commentCount: 35,
    isLike: false,
    experience: 5,
    location: "Hồ Chí Minh",
  },
  {
    id: 3,
    name: "Trần Văn Bình",
    service: "Sửa ống nước",
    category: "Nước",
    rating: 4.4,
    priceRange: "300k - 700k / giờ",
    pricePerHour: 300000,
    description:
      "Thợ sửa ống nước chuyên nghiệp với 10 năm kinh nghiệm, xử lý mọi vấn đề về hệ thống nước.",
    imageUrl: "https://picsum.photos/202",
    commentCount: 28,
    isLike: true,
    experience: 10,
    location: "Đà Nẵng",
  },
  {
    id: 4,
    name: "Phạm Thị Hương",
    service: "Sửa chữa đồ gia dụng",
    category: "Sửa chữa",
    rating: 4.3,
    priceRange: "250k - 550k / giờ",
    pricePerHour: 250000,
    description:
      "Chuyên sửa chữa các loại đồ gia dụng như tủ lạnh, máy giặt, điều hòa với 7 năm kinh nghiệm.",
    imageUrl: "https://picsum.photos/203",
    commentCount: 15,
    isLike: false,
    experience: 7,
    location: "Hải Phòng",
  },
  {
    id: 5,
    name: "Ngô Đình Long",
    service: "Lắp đặt điện",
    category: "Điện",
    rating: 4.7,
    priceRange: "350k - 800k / giờ",
    pricePerHour: 350000,
    description:
      "Chuyên lắp đặt hệ thống điện cho nhà ở và văn phòng, đảm bảo an toàn và hiệu quả.",
    imageUrl: "https://picsum.photos/204",
    commentCount: 42,
    isLike: true,
    experience: 12,
    location: "Hà Nội",
  },
];

export const categories = [
  { id: "all", name: "Tất cả", image: "https://picsum.photos/seed/all/200" },
  { id: "Điện", name: "Điện", image: "https://picsum.photos/seed/Điện/200" },
  { id: "Nước", name: "Nước", image: "https://picsum.photos/seed/Nước/200" },
  {
    id: "Dọn dẹp",
    name: "Dọn dẹp",
    image: "https://picsum.photos/seed/Dọn dẹp/200",
  },
  {
    id: "Sửa chữa",
    name: "Sửa chữa",
    image: "https://picsum.photos/seed/Sửa chữa/200",
  },
];

export const locations = [
  "Tất cả",
  "Hà Nội",
  "Hồ Chí Minh",
  "Đà Nẵng",
  "Hải Phòng",
];

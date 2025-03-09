export type Role = "user" | "provider";
export enum UserStatusEnum {
  BLOCKED = 0,
  PENDING = 1,
  ACTIVE = 2,
}

export type TimeStampType = {
  created_at: string;
  updated_at: string;
};
export type UserType = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  image_id?: string;
  image?: ImageType;
  address?: string;
  deleted_at: string | null;
  role: RoleType[];
  status: UserStatusEnum;
  is_oauth: boolean;
  service?: ServiceType[];
  order?: OrderType[];
  service_favorite?: ServiceType[];
  user_setting?: UserSettingType;
  viewed_service_log?: { service_id: number }[];
  notification?: NotificationType[];
  location?: LocationType;
} & TimeStampType;

export type ImageType = {
  id: number;
  path?: string;
  deleted_at: string | null;
} & TimeStampType;

export type Province = {
  id: number;
  name: string;
  code: string;
};

export type LocationType = {
  id: number;
  lng: number;
  lat: number;
  location_name: string;
  real_location_name?: string;
  province_id?: number;
  province?: Province;
  address?: string;
  deleted_at: string | null;
} & TimeStampType;

export type CategoryType = {
  id: number;
  category_name: string;
  image_id: string;
  deleted_at: string | null;
} & TimeStampType;

export type ViewedServiceType = {
  id: number;
  service_id: number;
  user_id: number;
  deleted_at: string | null;
  service?: ServiceType;
  user?: UserType;
} & TimeStampType;

export type PriceType = {
  price_value: number;
  price_name: string;
  service_id?: number;
  service?: ServiceType;
  id: number;
  deleted_at: string | null;
  benefit?: BenefitType[];
} & TimeStampType;

export type CommentType = {
  id: number;
  rate: number;
  comment_body: string;
  user_id?: number;
  user?: UserType;
  service_id?: number;
  deleted_at?: string | null;
  service?: ServiceType;
} & TimeStampType;

export type ServiceType = {
  id: number;
  service_name: string;
  service_description: string;
  user?: UserType;
  location?: LocationType;
  category?: CategoryType;
  price?: PriceType[];
  deleted_at?: string;
  comment?: CommentType[];
  is_liked?: boolean;
  comment_count?: number;
  average_rate?: number;
  benefit?: BenefitType[];
  comment_by_you?: CommentType;
  suggested_services?: number[];
  images?: { id: number; image_url: string }[];
  view_count?: number;
  order_count?: number;
} & TimeStampType;

export type NotificationType = {
  id: number;
  user_id: number;
  title: string;
  body: string;
  data: string;
  is_read: boolean;
} & TimeStampType;

export type RoleType = {
  id: string;
  deleted_at: string | null;
} & TimeStampType;

export type BenefitType = {
  id: number;
  service_id?: number;
  price_id?: number[];
  benefit_name: string;
  deleted_at: string | null;
} & TimeStampType;

export type OrderType = {
  id: number;
  user_id: number;
  service_id: number;
  user?: UserType;
  service?: ServiceType;
  price?: PriceType;
  price_id: number;
  price_final_value: number;
  status: OrderStatus;
  message?: string;
  address?: string;
  phone_number?: string;
  time_start: string;
  deleted_at: string | null;
  cancel_by?: UserType | number;
} & TimeStampType;

export type Rules = {
  [key: string]: { isValid: boolean; message: string }[];
};

export enum OrderStatus {
  CANCELLED = 0,
  PENDING = 1,
  IN_PROGRESS = 2,
  COMPLETED = 3,
}

export interface OrderStatusConfig {
  text: string;
  style: {
    text: { color: string };
    container: { backgroundColor: string };
  };
}

export const ORDER_STATUS_MAP: Record<OrderStatus, OrderStatusConfig> = {
  [OrderStatus.CANCELLED]: {
    text: "Đã hủy",
    style: {
      text: { color: "#dc2626" },
      container: { backgroundColor: "#fef2f2" },
    },
  },
  [OrderStatus.PENDING]: {
    text: "Đang chờ",
    style: {
      text: { color: "#d97706" },
      container: { backgroundColor: "#fefce8" },
    },
  },
  [OrderStatus.IN_PROGRESS]: {
    text: "Đang thực hiện",
    style: {
      text: { color: "#2563eb" },
      container: { backgroundColor: "#eff6ff" },
    },
  },
  [OrderStatus.COMPLETED]: {
    text: "Hoàn thành",
    style: {
      text: { color: "#16a34a" },
      container: { backgroundColor: "#f0fdf4" },
    },
  },
};

// Add image type to MessageType
export type MessageType = {
  id: string;
  author: number;
  message: string;
  roomId: string;
  seen: boolean;
  timestamp: string;
  image?: {
    url: string;
    width: number;
    height: number;
  };
};

export type UserSettingType = {
  id: number;
  user_id: number;
  is_notification: number;
  deleted_at: string | null;
} & TimeStampType;

export interface ProviderStatistics {
  total_services: number;
  order_statistics: {
    total_orders: number;
    completed_orders: number;
    cancelled_orders: number;
    pending_orders: number;
    total_revenue: number;
  };
  monthly_revenue: Array<{
    month: number;
    year: number;
    revenue: number;
  }>;
}

export interface ProviderService extends ServiceType {
  provider_id: number;
  status: "active" | "inactive" | "pending";
}

export interface ProviderOrder extends OrderType {
  provider_id: number;
  service: ProviderService;
}

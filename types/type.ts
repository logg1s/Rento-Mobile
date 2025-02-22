export type Role = "user" | "provider";

export type TimeStampType = {
  created_at: string;
  updated_at: string;
};
export type UserType = {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  image_id: string;
  deleted_at: string | null;
  role: RoleType[];
} & TimeStampType;

export type LocationType = {
  id: number;
  lng: number;
  lat: number;
  location_name: string;
  deleted_at: string | null;
} & TimeStampType;

export type CategoryType = {
  id: number;
  category_name: string;
  image_id: string;
  deleted_at: string | null;
} & TimeStampType;

export type PriceType = {
  id: number;
  price_name: string;
  price_value: number;
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
} & TimeStampType;

export type NotificationType = {
  id: number;
  user: UserType;
  title: string;
  message: string;
  is_read: boolean;
} & TimeStampType;

export type RoleType = {
  id: string;
  deleted_at: string | null;
} & TimeStampType;

export type BenefitType = {
  id: number;
  benefit_name: string;
  deleted_at: string | null;
} & TimeStampType;

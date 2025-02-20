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
  deleted_at: string;
  role: RoleType[];
} & TimeStampType;

export type LocationType = {
  id: number;
  lng: number;
  lat: number;
  location_name: string;
  deleted_at: string;
} & TimeStampType;

export type CategoryType = {
  id: number;
  category_name: string;
  image_id: string;
  deleted_at: string;
} & TimeStampType;

export type Price = {
  id: number;
  price_name: string;
  price_value: number;
  deleted_at: string;
} & TimeStampType;

export type ServiceType = {
  id: number;
  service_name: string;
  service_description: string;
  user: UserType;
  location: LocationType;
  category: CategoryType;
  price: Price[];
  deleted_at: string;
  isLiked: boolean;
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
  deleted_at: string;
} & TimeStampType;

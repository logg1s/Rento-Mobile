import { ServiceType } from "./type";
import { LocationType } from "./type";
import { axiosFetch } from "@/stores/dataStore";

export interface ServiceWithDistance extends ServiceType {
  distance?: number;
  location?: LocationType;
}

export interface NearbySearchResponse {
  status: "success" | "error";
  data: {
    current_page: number;
    data: ServiceWithDistance[];
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
      url: string | null;
      label: string;
      active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
  };
  message?: string;
}

export const fetchNearbyServicesByCoordinates = async (
  lat: number,
  lng: number,
  radius: number = 10
): Promise<ServiceWithDistance[]> => {
  try {
    const response = await axiosFetch(
      `/services/nearby?lat=${lat}&lng=${lng}&radius=${radius}`,
      "get"
    );
    if (response?.data?.status === "success") {
      return response.data.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Lỗi khi tìm dịch vụ gần đây:", error);
    return [];
  }
};

export const fetchNearbyServicesByProvince = async (
  provinceId: number
): Promise<ServiceWithDistance[]> => {
  try {
    const response = await axiosFetch(
      `/services/nearby?province_id=${provinceId}`,
      "get"
    );
    if (response?.data?.status === "success") {
      return response.data.data.data || [];
    }
    return [];
  } catch (error) {
    console.error("Lỗi khi tìm dịch vụ theo tỉnh:", error);
    return [];
  }
};

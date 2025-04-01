import { create } from "zustand";
import * as Location from "expo-location";
import { axiosFetch } from "./dataStore";

export interface Province {
  id: number;
  name: string;
  code: string;
}

export interface LocationState {
  provinces: Province[];
  loadingProvinces: boolean;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  error: string | null;
  loading: boolean;

  fetchProvinces: () => Promise<Province[]>;
  getProvinceById: (id: number) => Promise<Province | null>;
  searchProvinces: (keyword: string) => Promise<Province[]>;
  createLocation: (data: {
    province_id: number | null;
    address: string | null;
    lat?: number | null;
    lng?: number | null;
    location_name: string;
  }) => Promise<any>;
  updateLocation: (
    id: number,
    data: {
      province_id?: number | null;
      address?: string | null;
      lat?: number | null;
      lng?: number | null;
      location_name?: string;
    }
  ) => Promise<any>;
  requestPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<{
    latitude: number | null;
    longitude: number | null;
    address: string | null;
    province: Province | null;
    detailedAddress: string | null;
    formattedAddress?: string | null;
  } | null>;

  formatAddress: (geocode: Location.LocationGeocodedAddress) => string;
  getProvinceByName: (name: string) => Province | null;
}

const endpoints = {
  provinces: "/provinces",
  provinceById: (id: number) => `/provinces/${id}`,
  searchProvinces: "/provinces/search",

  locations: "/provider/locations",
  locationById: (id: number) => `/provider/locations/${id}`,
};

export const useLocationStore = create<LocationState>((set, get) => ({
  provinces: [],
  loadingProvinces: false,
  latitude: null,
  longitude: null,
  address: null,
  error: null,
  loading: false,

  fetchProvinces: async () => {
    try {
      set({ loadingProvinces: true });

      const response = await axiosFetch(endpoints.provinces);

      if (response?.data?.status === "success") {
        const provinces = response.data.data;
        set({ provinces, loadingProvinces: false });
        return provinces;
      }

      set({ loadingProvinces: false });
      return [];
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tỉnh thành:", error);

      const defaultProvinces: Province[] = [
        { id: 1, name: "Hà Nội", code: "HN" },
        { id: 2, name: "Hồ Chí Minh", code: "HCM" },
        { id: 3, name: "Đà Nẵng", code: "DN" },
        { id: 4, name: "Hải Phòng", code: "HP" },
        { id: 5, name: "Cần Thơ", code: "CT" },
        { id: 6, name: "An Giang", code: "AG" },
        { id: 7, name: "Bà Rịa - Vũng Tàu", code: "BR-VT" },
        { id: 8, name: "Bắc Giang", code: "BG" },
        { id: 9, name: "Bắc Kạn", code: "BK" },
        { id: 10, name: "Bạc Liêu", code: "BL" },
      ];

      set({ provinces: defaultProvinces, loadingProvinces: false });
      return defaultProvinces;
    }
  },

  getProvinceById: async (id: number) => {
    try {
      const response = await axiosFetch(endpoints.provinceById(id));
      if (response?.data?.status === "success") {
        return response.data.data;
      }
      return null;
    } catch (error) {
      console.error(`Lỗi khi lấy thông tin tỉnh thành ID ${id}:`, error);
      return null;
    }
  },

  searchProvinces: async (keyword: string) => {
    try {
      const response = await axiosFetch(
        `${endpoints.searchProvinces}?keyword=${keyword}`
      );
      if (response?.data?.status === "success") {
        return response.data.data;
      }
      return [];
    } catch (error) {
      console.error(
        `Lỗi khi tìm kiếm tỉnh thành với từ khóa "${keyword}":`,
        error
      );
      return [];
    }
  },

  createLocation: async (data: {
    province_id: number | null;
    address: string | null;
    lat?: number | null;
    lng?: number | null;
    location_name: string;
  }) => {
    try {
      const response = await axiosFetch(endpoints.locations, "post", data);
      return response?.data;
    } catch (error) {
      console.error("Lỗi khi tạo địa điểm mới:", error);
      return null;
    }
  },

  updateLocation: async (
    id: number,
    data: {
      province_id?: number | null;
      address?: string | null;
      lat?: number | null;
      lng?: number | null;
      location_name?: string;
    }
  ) => {
    try {
      const response = await axiosFetch(
        endpoints.locationById(id),
        "put",
        data
      );
      return response?.data;
    } catch (error) {
      console.error(`Lỗi khi cập nhật địa điểm ID ${id}:`, error);
      return null;
    }
  },

  requestPermission: async () => {
    try {
      set({ loading: true, error: null });

      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        const response = await Location.requestForegroundPermissionsAsync();
        status = response.status;
      }

      if (status !== "granted") {
        set({
          error: "Quyền truy cập vị trí bị từ chối",
          loading: false,
        });
        return false;
      }

      return true;
    } catch (error) {
      set({
        error: "Không thể yêu cầu quyền truy cập vị trí",
        loading: false,
      });
      return false;
    }
  },

  getCurrentLocation: async () => {
    const { provinces } = get();

    try {
      set({ loading: true, error: null });

      const requestPermission = get().requestPermission;
      const hasPermission = await requestPermission();

      if (!hasPermission) {
        set({ loading: false });
        return null;
      }

      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        set({
          error: "Dịch vụ vị trí bị tắt",
          loading: false,
        });
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      const latitude: number = location.coords.latitude;
      const longitude: number = location.coords.longitude;

      const geocodeResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (!geocodeResults || geocodeResults.length === 0) {
        set({
          error: "Không thể lấy thông tin địa chỉ từ vị trí",
          loading: false,
        });
        return null;
      }

      const geocode = geocodeResults[0];

      const formatAddress = get().formatAddress;
      const address: string = formatAddress(geocode);

      let province: Province | null = null;

      if (geocode.region) {
        province =
          provinces.find(
            (p) =>
              p.name
                .toLowerCase()
                .includes(geocode.region?.toLowerCase() || "") ||
              geocode.region?.toLowerCase().includes(p.name.toLowerCase())
          ) || null;
      }

      if (!province && geocode.city) {
        province =
          provinces.find(
            (p) =>
              p.name
                .toLowerCase()
                .includes(geocode.city?.toLowerCase() || "") ||
              geocode.city?.toLowerCase().includes(p.name.toLowerCase())
          ) || null;
      }

      const parts = [
        geocode.name,
        geocode.street,
        geocode.district,
        geocode.subregion,
      ].filter(Boolean);

      const detailedAddress: string = parts.join(", ");

      set({
        latitude,
        longitude,
        address,
        error: null,
        loading: false,
      });

      return {
        latitude,
        longitude,
        address,
        province,
        detailedAddress,
        formattedAddress: geocode.formattedAddress || null,
      };
    } catch (error) {
      console.error("Lỗi khi lấy vị trí:", error);
      set({
        error: "Không thể lấy vị trí hiện tại",
        loading: false,
      });
      return null;
    }
  },

  formatAddress: (geocode: Location.LocationGeocodedAddress) => {
    if (geocode.formattedAddress) {
      return geocode.formattedAddress;
    }

    const components = [
      geocode.name,
      geocode.street,
      geocode.district,
      geocode.city,
      geocode.region,
      geocode.country,
    ].filter(Boolean);

    return components.join(", ");
  },

  getProvinceByName: (name: string) => {
    const { provinces } = get();
    if (!name || !provinces.length) return null;

    return (
      provinces.find(
        (p) =>
          p.name.toLowerCase().includes(name.toLowerCase()) ||
          name.toLowerCase().includes(p.name.toLowerCase())
      ) || null
    );
  },
}));

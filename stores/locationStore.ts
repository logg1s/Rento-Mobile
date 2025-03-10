import { create } from "zustand";
import * as Location from "expo-location";
import { axiosFetch } from "./dataStore";

export interface Province {
  id: number;
  name: string;
  code: string;
}

export interface LocationState {
  // Trạng thái
  provinces: Province[];
  loadingProvinces: boolean;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  error: string | null;
  loading: boolean;

  // API actions
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

  // Tiện ích
  formatAddress: (geocode: Location.LocationGeocodedAddress) => string;
  getProvinceByName: (name: string) => Province | null;
}

// Các endpoint API
const endpoints = {
  // Provinces
  provinces: "/provinces",
  provinceById: (id: number) => `/provinces/${id}`,
  searchProvinces: "/provinces/search",

  // Locations
  locations: "/provider/locations",
  locationById: (id: number) => `/provider/locations/${id}`,
};

export const useLocationStore = create<LocationState>((set, get) => ({
  // Trạng thái
  provinces: [],
  loadingProvinces: false,
  latitude: null,
  longitude: null,
  address: null,
  error: null,
  loading: false,

  // Lấy danh sách tỉnh thành từ API
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

      // Cung cấp dữ liệu tỉnh thành mặc định khi API bị lỗi
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

  // Lấy thông tin tỉnh thành theo ID
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

  // Tìm kiếm tỉnh thành theo từ khóa
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

  // Tạo địa điểm mới
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

  // Cập nhật thông tin địa điểm
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

  // Xin quyền truy cập vị trí
  requestPermission: async () => {
    try {
      set({ loading: true, error: null });

      // Kiểm tra xem quyền đã được cấp hay chưa
      let { status } = await Location.getForegroundPermissionsAsync();

      // Nếu chưa được cấp quyền, yêu cầu quyền
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

  // Lấy vị trí hiện tại
  getCurrentLocation: async () => {
    const { provinces } = get();

    try {
      set({ loading: true, error: null });

      // Kiểm tra quyền
      const requestPermission = get().requestPermission;
      const hasPermission = await requestPermission();

      if (!hasPermission) {
        set({ loading: false });
        return null;
      }

      // Kiểm tra vị trí có bật hay không
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        set({
          error: "Dịch vụ vị trí bị tắt",
          loading: false,
        });
        return null;
      }

      // Lấy vị trí hiện tại
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
      });

      // Ép kiểu về number để phù hợp với interface
      const latitude: number = location.coords.latitude;
      const longitude: number = location.coords.longitude;

      // Lấy địa chỉ từ tọa độ
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

      // Tạo địa chỉ đầy đủ
      const formatAddress = get().formatAddress;
      const address: string = formatAddress(geocode);

      // Tìm tỉnh thành phù hợp từ geocode
      let province: Province | null = null;
      // Thử tìm province dựa vào region hoặc city
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

      // Nếu không tìm thấy bằng region, thử với city
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

      // Tạo địa chỉ chi tiết từ các thông tin có sẵn
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

  // Hàm định dạng địa chỉ từ kết quả geocode
  formatAddress: (geocode: Location.LocationGeocodedAddress) => {
    // Ưu tiên sử dụng formattedAddress nếu có
    if (geocode.formattedAddress) {
      return geocode.formattedAddress;
    }

    // Tạo địa chỉ từ các thành phần nếu không có formattedAddress
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

  // Hàm tìm tỉnh theo tên
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

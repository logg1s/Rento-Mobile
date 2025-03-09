import { create } from "zustand";
import {
  ProviderStatistics,
  ProviderService,
  ProviderOrder,
  ServiceType,
} from "@/types/type";
import { axiosFetch } from "./dataStore";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const rentoHost = process.env.EXPO_PUBLIC_API_HOST + "/api";

interface ProviderStore {
  statistics: ProviderStatistics | null;
  services: ProviderService[];
  orders: ProviderOrder[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStatistics: () => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchOrders: (status?: string) => Promise<void>;
  updateOrderStatus: (orderId: number, status: string) => Promise<void>;
  createService: (data: any) => Promise<void>;
  updateService: (id: number, data: any) => Promise<void>;
  deleteService: (id: number) => Promise<void>;
  fetchServiceById: (id: number) => Promise<ServiceType | null>;
  deleteServicePrice: (serviceId: number, priceId: number) => Promise<void>;
  addServiceBenefit: (
    serviceId: number,
    data: { benefit_name: string; price_id: number[] }
  ) => Promise<any>;
  updateServiceBenefit: (
    serviceId: number,
    benefitId: number,
    data: { benefit_name: string; price_id: number[] }
  ) => Promise<any>;
  deleteServiceBenefit: (serviceId: number, benefitId: number) => Promise<void>;
  getIndependentBenefits: (serviceId: number) => Promise<any>;
  attachBenefitsToPrice: (
    priceId: number,
    benefitIds: number[]
  ) => Promise<void>;
  detachBenefitFromPrice: (benefitId: number, priceId: number) => Promise<void>;
  bulkUpdateBenefits: (
    benefits: { id: number; benefit_name: string; price_ids: number[] }[]
  ) => Promise<any>;
  addServicePriceWithBenefits: (
    serviceId: number,
    data: { price_name: string; price_value: number; benefit_ids?: number[] }
  ) => Promise<any>;
  updateServicePriceWithBenefits: (
    priceId: number,
    data: { price_name: string; price_value: number; benefit_ids?: number[] }
  ) => Promise<any>;
  bulkUpdatePrices: (
    prices: {
      id: number;
      price_name: string;
      price_value: number;
      benefit_ids?: number[];
    }[]
  ) => Promise<any>;
}

const useProviderStore = create<ProviderStore>((set, get) => ({
  statistics: null,
  services: [],
  orders: [],
  isLoading: false,
  error: null,

  fetchStatistics: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch("/provider/statistics");
      set({ statistics: response?.data || null, isLoading: false });
    } catch (error) {
      set({ error: "Không thể tải thống kê", isLoading: false });
    }
  },

  fetchServices: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch("/provider/services/my-services");
      set({ services: response?.data || [], isLoading: false });
      return response?.data || [];
    } catch (error) {
      console.error("Lỗi khi tải danh sách dịch vụ:", error);
      set({ error: "Không thể tải danh sách dịch vụ", isLoading: false });
      return [];
    }
  },

  fetchOrders: async (status = "all") => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch("/provider/orders/my-orders", "get", {
        params: { status },
      });
      set({ orders: response?.data || [], isLoading: false });
    } catch (error) {
      set({ error: "Không thể tải danh sách đơn hàng", isLoading: false });
    }
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    try {
      set({ isLoading: true, error: null });
      await axiosFetch(`/provider/orders/${orderId}/status`, "put", { status });
      await get().fetchOrders();
      set({ isLoading: false });
    } catch (error) {
      set({
        error: "Không thể cập nhật trạng thái đơn hàng",
        isLoading: false,
      });
    }
  },

  createService: async (data: any) => {
    try {
      set({ isLoading: true, error: null });

      // Kiểm tra dữ liệu trước khi gửi
      if (
        !data.get("service_name") ||
        !data.get("service_description") ||
        !data.get("location_name") ||
        !data.get("category_id")
      ) {
        throw new Error("Thiếu thông tin bắt buộc");
      }

      await axiosFetch("/provider/services", "post", data, true);
      await get().fetchServices();
      set({ isLoading: false });
    } catch (error: any) {
      console.error("Lỗi khi tạo dịch vụ:", error?.response?.data || error);
      set({ error: "Không thể tạo dịch vụ", isLoading: false });
      throw error;
    }
  },

  updateService: async (id: number, data: any) => {
    try {
      set({ isLoading: true, error: null });

      // Kiểm tra xem data có phải là FormData không
      const isFormData = data instanceof FormData;

      // Nếu là FormData, kiểm tra các trường bắt buộc
      if (isFormData) {
        if (
          !data.get("service_name") ||
          !data.get("service_description") ||
          !data.get("location_name") ||
          !data.get("category_id")
        ) {
          throw new Error("Thiếu thông tin bắt buộc");
        }
      } else {
        // Nếu là JSON, kiểm tra các trường bắt buộc
        if (
          !data.service_name ||
          !data.service_description ||
          !data.location_name ||
          !data.category_id
        ) {
          throw new Error("Thiếu thông tin bắt buộc");
        }
      }

      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem("jwtToken");

      // Gửi dữ liệu lên server
      const response = await axios({
        url: rentoHost + `/provider/services/${id}`,
        method: isFormData ? "post" : "put", // Sử dụng POST với _method=PUT nếu là FormData
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": isFormData
            ? "multipart/form-data"
            : "application/json",
        },
        data: data,
      });

      // Cập nhật lại danh sách dịch vụ
      await get().fetchServices();

      set({ isLoading: false });
      return response?.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật dịch vụ:",
        error?.response?.data || error
      );
      set({ error: "Không thể cập nhật dịch vụ", isLoading: false });
      throw error;
    }
  },

  deleteService: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch(
        `/provider/services/${id}/false`,
        "delete"
      );

      // Kiểm tra response để đảm bảo dịch vụ đã được xóa thành công
      if (response && response.status >= 200 && response.status < 300) {
        // Cập nhật danh sách dịch vụ sau khi xóa thành công
        await get().fetchServices();
        set({ isLoading: false });
      } else {
        throw new Error("Không nhận được phản hồi thành công từ máy chủ");
      }
    } catch (error) {
      console.error("Lỗi khi xóa dịch vụ:", error);
      set({ error: "Không thể xóa dịch vụ", isLoading: false });
      throw error; // Ném lỗi để component có thể xử lý
    }
  },

  fetchServiceById: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch(`/provider/services/${id}`);
      set({ isLoading: false });
      return response?.data || null;
    } catch (error: any) {
      console.error("Lỗi khi tải dịch vụ:", error?.response?.data || error);
      set({ error: "Không thể tải thông tin dịch vụ", isLoading: false });
      return null;
    }
  },

  deleteServicePrice: async (serviceId: number, priceId: number) => {
    try {
      set({ isLoading: true, error: null });
      await axiosFetch(
        `/provider/services/${serviceId}/prices/${priceId}`,
        "delete"
      );
      set({ isLoading: false });
    } catch (error: any) {
      console.error("Lỗi khi xóa gói dịch vụ:", error?.response?.data || error);
      set({ error: "Không thể xóa gói dịch vụ", isLoading: false });
      throw error;
    }
  },

  addServiceBenefit: async (
    serviceId: number,
    data: { benefit_name: string; price_id: number[] }
  ) => {
    try {
      set({ isLoading: true, error: null });

      // Sử dụng API mới để thêm benefit và liên kết với prices trong một lần
      const payload = {
        benefit_name: data.benefit_name,
        service_id: serviceId,
        price_ids:
          data.price_id && data.price_id.length > 0 ? data.price_id : null,
      };

      const response = await axiosFetch(
        `/benefits/create-with-prices`,
        "post",
        payload
      );
      set({ isLoading: false });
      return response?.data;
    } catch (error: any) {
      console.error("Lỗi khi thêm lợi ích:", error?.response?.data || error);
      set({ error: "Không thể thêm lợi ích", isLoading: false });
      throw error;
    }
  },

  updateServiceBenefit: async (
    serviceId: number,
    benefitId: number,
    data: { benefit_name: string; price_id: number[] }
  ) => {
    try {
      set({ isLoading: true, error: null });

      // Sử dụng API mới để cập nhật benefit và liên kết với prices trong một lần
      const payload = {
        benefit_name: data.benefit_name,
        price_ids: data.price_id || [],
      };

      const response = await axiosFetch(
        `/benefits/${benefitId}/update-with-prices`,
        "put",
        payload
      );
      set({ isLoading: false });
      return response?.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật lợi ích:",
        error?.response?.data || error
      );
      set({ error: "Không thể cập nhật lợi ích", isLoading: false });
      throw error;
    }
  },

  deleteServiceBenefit: async (serviceId: number, benefitId: number) => {
    try {
      set({ isLoading: true, error: null });
      // API delete trong BenefitController
      await axiosFetch(`/benefits/${benefitId}`, "delete");
      set({ isLoading: false });
    } catch (error: any) {
      console.error("Lỗi khi xóa lợi ích:", error?.response?.data || error);
      set({ error: "Không thể xóa lợi ích", isLoading: false });
      throw error;
    }
  },

  getIndependentBenefits: async (serviceId: number) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch(`/benefits/independent/${serviceId}`);
      set({ isLoading: false });
      return response?.data || [];
    } catch (error: any) {
      console.error(
        "Lỗi khi lấy lợi ích độc lập:",
        error?.response?.data || error
      );
      set({ error: "Không thể lấy lợi ích độc lập", isLoading: false });
      return [];
    }
  },

  attachBenefitsToPrice: async (priceId: number, benefitIds: number[]) => {
    try {
      set({ isLoading: true, error: null });
      await axiosFetch(`/benefits/attach-to-price/${priceId}`, "post", {
        benefit_ids: benefitIds,
      });
      set({ isLoading: false });
    } catch (error: any) {
      console.error(
        "Lỗi khi gán lợi ích cho gói giá:",
        error?.response?.data || error
      );
      set({ error: "Không thể gán lợi ích cho gói giá", isLoading: false });
      throw error;
    }
  },

  detachBenefitFromPrice: async (benefitId: number, priceId: number) => {
    try {
      set({ isLoading: true, error: null });
      await axiosFetch(`/benefits/${benefitId}/detach-price`, "post", {
        price_id: priceId,
      });
      set({ isLoading: false });
    } catch (error: any) {
      console.error(
        "Lỗi khi xóa liên kết lợi ích:",
        error?.response?.data || error
      );
      set({ error: "Không thể xóa liên kết lợi ích", isLoading: false });
      throw error;
    }
  },

  bulkUpdateBenefits: async (
    benefits: { id: number; benefit_name: string; price_ids: number[] }[]
  ) => {
    try {
      set({ isLoading: true, error: null });

      const response = await axiosFetch(`/benefits/bulk-update`, "post", {
        benefits,
      });

      set({ isLoading: false });
      return response?.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật hàng loạt lợi ích:",
        error?.response?.data || error
      );
      set({ error: "Không thể cập nhật hàng loạt lợi ích", isLoading: false });
      throw error;
    }
  },

  addServicePriceWithBenefits: async (
    serviceId: number,
    data: { price_name: string; price_value: number; benefit_ids?: number[] }
  ) => {
    try {
      set({ isLoading: true, error: null });
      const payload = {
        ...data,
        service_id: serviceId,
      };
      const response = await axiosFetch(
        `/prices/create-with-benefits`,
        "post",
        payload
      );
      set({ isLoading: false });
      return response?.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi thêm giá và lợi ích:",
        error?.response?.data || error
      );
      set({ error: "Không thể thêm giá và lợi ích", isLoading: false });
      throw error;
    }
  },

  updateServicePriceWithBenefits: async (
    priceId: number,
    data: { price_name: string; price_value: number; benefit_ids?: number[] }
  ) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch(
        `/prices/${priceId}/update-with-benefits`,
        "put",
        data
      );
      set({ isLoading: false });
      return response?.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật giá và lợi ích:",
        error?.response?.data || error
      );
      set({ error: "Không thể cập nhật giá và lợi ích", isLoading: false });
      throw error;
    }
  },

  bulkUpdatePrices: async (
    prices: {
      id: number;
      price_name: string;
      price_value: number;
      benefit_ids?: number[];
    }[]
  ) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch(`/prices/bulk-update`, "post", {
        prices,
      });
      set({ isLoading: false });
      return response?.data;
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật hàng loạt giá:",
        error?.response?.data || error
      );
      set({ error: "Không thể cập nhật hàng loạt giá", isLoading: false });
      throw error;
    }
  },
}));

export default useProviderStore;

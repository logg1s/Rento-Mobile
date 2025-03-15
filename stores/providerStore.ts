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

// Period type for statistics filtering
export type StatisticsPeriod = "week" | "month" | "year";

interface ProviderStore {
  statistics: ProviderStatistics | null;
  services: ProviderService[];
  orders: ProviderOrder[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchStatistics: () => Promise<void>;
  fetchStatisticsWithPeriod: (period: StatisticsPeriod) => Promise<void>;
  fetchServices: () => Promise<void>;
  fetchOrders: (
    status: string,
    cursor: string | null,
    search: string,
    searchFilter: string,
    sortBy: string,
    startDate: string | null,
    endDate: string | null
  ) => Promise<any>;
  updateOrderStatus: (orderId: number, status: string) => Promise<boolean>;
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

      if (response?.data) {
        set({ statistics: response.data, isLoading: false });
        return response.data;
      } else {
        set({ statistics: null, isLoading: false });
        return null;
      }
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
      set({
        error: "Không thể tải thống kê",
        isLoading: false,
        statistics: null,
      });
      return null;
    }
  },

  fetchStatisticsWithPeriod: async (period: StatisticsPeriod = "week") => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch(
        `/provider/statistics?period=${period}`
      );
      set({ statistics: response?.data || null, isLoading: false });
      return response?.data;
    } catch (error) {
      console.error(`Lỗi khi tải thống kê cho kỳ ${period}:`, error);
      set({ error: "Không thể tải thống kê", isLoading: false });
      throw error;
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

  fetchOrders: async (
    status: string = "all",
    cursor: string | null = null,
    search: string = "",
    searchFilter: string = "service",
    sortBy: string = "newest",
    startDate: string | null = null,
    endDate: string | null = null
  ) => {
    try {
      set({ isLoading: true });
      const params = new URLSearchParams({
        status,
        ...(cursor && { cursor }),
        ...(search && { search }),
        ...(searchFilter && { searchFilter }),
        ...(sortBy && { sortBy }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await axiosFetch(
        `/provider/orders/my-orders?${params.toString()}`,
        "get"
      );

      if (response?.data) {
        if (Array.isArray(response.data)) {
          return {
            data: response.data,
            next_cursor: null,
            has_more: false,
            counts: {
              total: response.data.length,
              pending: response.data.filter((o) => o.status === 1).length,
              processing: response.data.filter((o) => o.status === 2).length,
              completed: response.data.filter((o) => o.status === 3).length,
              cancelled: response.data.filter((o) => o.status === 0).length,
            },
          };
        }
        return response.data;
      }

      return {
        data: [],
        next_cursor: null,
        has_more: false,
        counts: {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          cancelled: 0,
        },
      };
    } catch (error) {
      console.error("Error fetching orders:", error);
      return {
        data: [],
        next_cursor: null,
        has_more: false,
        counts: {
          total: 0,
          pending: 0,
          processing: 0,
          completed: 0,
          cancelled: 0,
        },
      };
    } finally {
      set({ isLoading: false });
    }
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    try {
      set({ isLoading: true, error: null });

      if (
        !["pending", "processing", "completed", "cancelled"].includes(status)
      ) {
        throw new Error("Trạng thái không hợp lệ");
      }

      const response = await axiosFetch(
        `/provider/orders/${orderId}/status`,
        "put",
        { status }
      );

      await get().fetchOrders("all", null, "", "service", "newest", null, null);
      set({ isLoading: false });
      return true;
    } catch (error) {
      console.error("Lỗi khi cập nhật trạng thái đơn hàng:", error);
      set({
        error: "Không thể cập nhật trạng thái đơn hàng",
        isLoading: false,
      });
      throw error;
    }
  },

  createService: async (data: any) => {
    try {
      set({ isLoading: true, error: null });

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

      const isFormData = data instanceof FormData;

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
        if (
          !data.service_name ||
          !data.service_description ||
          !data.location_name ||
          !data.category_id
        ) {
          throw new Error("Thiếu thông tin bắt buộc");
        }
      }

      const token = await AsyncStorage.getItem("jwtToken");

      const response = await axios({
        url: rentoHost + `/provider/services/${id}`,
        method: isFormData ? "post" : "put",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": isFormData
            ? "multipart/form-data"
            : "application/json",
        },
        data: data,
      });

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

      if (response && response.status >= 200 && response.status < 300) {
        await get().fetchServices();
        set({ isLoading: false });
      } else {
        throw new Error("Không nhận được phản hồi thành công từ máy chủ");
      }
    } catch (error) {
      console.error("Lỗi khi xóa dịch vụ:", error);
      set({ error: "Không thể xóa dịch vụ", isLoading: false });
      throw error;
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

      const payload = {
        benefit_name: data.benefit_name,
        service_id: serviceId,
        price_ids:
          data.price_id && data.price_id.length > 0 ? data.price_id : null,
      };

      const response = await axiosFetch(
        `/provider/benefits/create-with-prices`,
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

      const payload = {
        benefit_name: data.benefit_name,
        price_ids: data.price_id || [],
      };

      const response = await axiosFetch(
        `/provider/benefits/${benefitId}/update-with-prices`,
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
      await axiosFetch(`/provider/benefits/${benefitId}`, "delete");
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
      const response = await axiosFetch(
        `/provider/benefits/independent/${serviceId}`
      );
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

  bulkUpdateBenefits: async (
    benefits: { id: number; benefit_name: string; price_ids: number[] }[]
  ) => {
    try {
      set({ isLoading: true, error: null });

      const response = await axiosFetch(
        `/provider/benefits/bulk-update`,
        "post",
        {
          benefits,
        }
      );

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
        `/provider/prices/create-with-benefits`,
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
        `/provider/prices/${priceId}/update-with-benefits`,
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
      const response = await axiosFetch(
        `/provider/prices/bulk-update`,
        "post",
        {
          prices,
        }
      );
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

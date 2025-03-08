import { create } from "zustand";
import {
  ProviderStatistics,
  ProviderService,
  ProviderOrder,
} from "@/types/type";
import { axiosFetch } from "./dataStore";

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
      const response = await axiosFetch.get("/provider/statistics");
      set({ statistics: response.data, isLoading: false });
    } catch (error) {
      set({ error: "Không thể tải thống kê", isLoading: false });
    }
  },

  fetchServices: async () => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch.get("/provider/services/my-services");
      set({ services: response.data, isLoading: false });
    } catch (error) {
      set({ error: "Không thể tải danh sách dịch vụ", isLoading: false });
    }
  },

  fetchOrders: async (status = "all") => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch.get("/provider/orders/my-orders", {
        params: { status },
      });
      set({ orders: response.data, isLoading: false });
    } catch (error) {
      set({ error: "Không thể tải danh sách đơn hàng", isLoading: false });
    }
  },

  updateOrderStatus: async (orderId: number, status: string) => {
    try {
      set({ isLoading: true, error: null });
      await axiosFetch.put(`/provider/orders/${orderId}/status`, { status });
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
      await axiosFetch.post("/provider/services", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await get().fetchServices();
      set({ isLoading: false });
    } catch (error) {
      set({ error: "Không thể tạo dịch vụ", isLoading: false });
    }
  },

  updateService: async (id: number, data: any) => {
    try {
      set({ isLoading: true, error: null });
      await axiosFetch.put(`/provider/services/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      await get().fetchServices();
      set({ isLoading: false });
    } catch (error) {
      set({ error: "Không thể cập nhật dịch vụ", isLoading: false });
    }
  },

  deleteService: async (id: number) => {
    try {
      set({ isLoading: true, error: null });
      await axiosFetch.delete(`/provider/services/${id}`);
      await get().fetchServices();
      set({ isLoading: false });
    } catch (error) {
      set({ error: "Không thể xóa dịch vụ", isLoading: false });
    }
  },
}));

export default useProviderStore;

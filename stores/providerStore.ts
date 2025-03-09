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
  addServicePrice: (
    serviceId: number,
    data: { price_name: string; price_value: number }
  ) => Promise<any>;
  updateServicePrice: (
    serviceId: number,
    priceId: number,
    data: { price_name: string; price_value: number }
  ) => Promise<void>;
  deleteServicePrice: (serviceId: number, priceId: number) => Promise<void>;
  addServiceBenefit: (
    serviceId: number,
    data: { benefit_name: string; price_id: number[] }
  ) => Promise<void>;
  updateServiceBenefit: (
    serviceId: number,
    benefitId: number,
    data: { benefit_name: string; price_id: number[] }
  ) => Promise<void>;
  deleteServiceBenefit: (serviceId: number, benefitId: number) => Promise<void>;
  getIndependentBenefits: (serviceId: number) => Promise<any>;
  attachBenefitsToPrice: (
    priceId: number,
    benefitIds: number[]
  ) => Promise<void>;
  detachBenefitFromPrice: (benefitId: number, priceId: number) => Promise<void>;
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

  addServicePrice: async (
    serviceId: number,
    data: { price_name: string; price_value: number }
  ) => {
    try {
      set({ isLoading: true, error: null });
      const response = await axiosFetch(
        `/provider/services/${serviceId}/prices`,
        "post",
        data
      );
      set({ isLoading: false });
      return response;
    } catch (error: any) {
      console.error(
        "Lỗi khi thêm gói dịch vụ:",
        error?.response?.data || error
      );
      set({ error: "Không thể thêm gói dịch vụ", isLoading: false });
      throw error;
    }
  },

  updateServicePrice: async (
    serviceId: number,
    priceId: number,
    data: { price_name: string; price_value: number }
  ) => {
    try {
      set({ isLoading: true, error: null });
      await axiosFetch(
        `/provider/services/${serviceId}/prices/${priceId}`,
        "put",
        data
      );
      set({ isLoading: false });
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật gói dịch vụ:",
        error?.response?.data || error
      );
      set({ error: "Không thể cập nhật gói dịch vụ", isLoading: false });
      throw error;
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
      // Sử dụng API từ BenefitController
      const payload = {
        benefit_name: data.benefit_name,
        service_id: serviceId,
      };
      // API create trong BenefitController không chấp nhận price_id
      const response = await axiosFetch(`/benefits`, "post", payload);

      // Sau khi tạo benefit, cập nhật liên kết với prices nếu có
      if (response?.data?.id) {
        const benefitId = response.data.id;

        // Chỉ liên kết với prices nếu có price_id được chọn
        if (data.price_id && data.price_id.length > 0) {
          // Nếu có price_id được chọn, liên kết từng price_id với benefit
          for (const priceId of data.price_id) {
            await axiosFetch(`/benefits/${benefitId}`, "put", {
              price_id: priceId,
            });
          }
        }
        // Không cần thêm else case vì chúng ta muốn benefit độc lập
        // không liên kết với bất kỳ price nào
      }

      set({ isLoading: false });
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

      // Cập nhật tên benefit và phải kèm theo ít nhất một price_id
      // Nếu không có price_id nào được chọn trong form, lấy thông tin service để có danh sách prices
      if (!data.price_id || data.price_id.length === 0) {
        // Trước tiên lấy thông tin service để có danh sách prices
        const service = await axiosFetch(`/provider/services/${serviceId}`);
        if (service?.data?.price && service.data.price.length > 0) {
          // Lấy price_id đầu tiên từ service, để đảm bảo có giá trị gửi đi
          const firstPriceId = service.data.price[0].id;
          // Cập nhật với price_id đầu tiên
          await axiosFetch(`/benefits/${benefitId}`, "put", {
            benefit_name: data.benefit_name,
            price_id: firstPriceId,
          });
        } else {
          // Nếu service không có price nào, chỉ gửi một request cập nhật tên
          // Gửi một giá trị giả cho price_id để tránh lỗi
          await axiosFetch(`/benefits/${benefitId}`, "put", {
            benefit_name: data.benefit_name,
            price_id: 0, // Giá trị này sẽ không tồn tại trong DB, nhưng sẽ tránh lỗi undefined key
          });
        }
      } else {
        // Nếu có price_id được chọn, cập nhật từng price_id với benefit
        for (const priceId of data.price_id) {
          await axiosFetch(`/benefits/${benefitId}`, "put", {
            benefit_name: data.benefit_name,
            price_id: priceId,
          });
        }
      }

      set({ isLoading: false });
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
}));

export default useProviderStore;

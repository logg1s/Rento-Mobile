import axios from "@/lib/axios";

export const getProviderStatistics = async () => {
  const response = await axios.get("/provider/statistics");
  return response.data;
};

export const getProviderServices = async () => {
  const response = await axios.get("/provider/services/my-services");
  return response.data;
};

export const getProviderOrders = async (status = "all") => {
  const response = await axios.get("/provider/orders/my-orders", {
    params: { status },
  });
  return response.data;
};

export const updateOrderStatus = async ({ orderId, status }) => {
  const response = await axios.put(`/provider/orders/${orderId}/status`, {
    status,
  });
  return response.data;
};

export const createService = async (data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (key === "images") {
      data[key].forEach((image, index) => {
        formData.append(`images[${index}]`, {
          uri: image.uri,
          type: "image/jpeg",
          name: `image-${index}.jpg`,
        });
      });
    } else {
      formData.append(key, data[key]);
    }
  });

  const response = await axios.post("/provider/services", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const updateService = async (id, data) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    if (key === "images") {
      data[key].forEach((image, index) => {
        if (image.uri) {
          // Chỉ upload ảnh mới
          formData.append(`images[${index}]`, {
            uri: image.uri,
            type: "image/jpeg",
            name: `image-${index}.jpg`,
          });
        }
      });
    } else {
      formData.append(key, data[key]);
    }
  });

  const response = await axios.post(`/provider/services/${id}`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
};

export const deleteService = async (id) => {
  const response = await axios.delete(`/provider/services/${id}`);
  return response.data;
};

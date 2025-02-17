import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import useAuthStore from "../stores/authStore";

interface FetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
}

interface UseFetchProps {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE";
  data?: any;
}

const useFetch = <T>({
  url,
  method = "GET",
  data,
}: UseFetchProps): FetchState<T> => {
  const token = useAuthStore((state) => state.token);
  const refreshAccessToken = useAuthStore((state) => state.refreshAccessToken);

  const [responseData, setResponseData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<boolean>(false);

  const fetchData = useCallback(async () => {
    if (!token) {
      setError("Không có token");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const config = {
        method,
        url,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        data,
      };

      const response = await axios(config);
      setResponseData(response.data);
    } catch (err) {
      if (err?.response?.status === 401 && !retrying) {
        setRetrying(true);
        const refreshSuccess = await refreshAccessToken();
        if (refreshSuccess) {
          fetchData();
        } else {
          setError("Token hết hạn và không thể refresh.");
        }
      } else {
        setError("Có lỗi xảy ra khi tải dữ liệu.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [token, refreshAccessToken, url, method, data, retrying]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data: responseData, isLoading, error, refresh: fetchData };
};

export default useFetch;

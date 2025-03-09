import { useState, useEffect } from "react";
import * as Location from "expo-location";
import { Alert } from "react-native";
import { axiosFetch } from "../stores/dataStore";

export interface Province {
  id: number;
  name: string;
  code: string;
}

export interface LocationData {
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  error: string | null;
  loading: boolean;
  province: Province | null;
  detailedAddress: string | null;
  formattedAddress: string | null;
}

export const useLocation = () => {
  const [locationData, setLocationData] = useState<LocationData>({
    latitude: null,
    longitude: null,
    address: null,
    error: null,
    loading: false,
    province: null,
    detailedAddress: null,
    formattedAddress: null,
  });
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState<boolean>(false);

  // Lấy danh sách tỉnh thành từ API
  const fetchProvinces = async () => {
    try {
      setLoadingProvinces(true);
      const response = await axiosFetch("/provinces");
      if (response?.data?.status === "success") {
        setProvinces(response.data.data);
      }
    } catch (error) {
      console.error("Lỗi khi lấy danh sách tỉnh thành:", error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  // Gọi API khi component được tạo
  useEffect(() => {
    fetchProvinces();
  }, []);

  const requestPermission = async () => {
    try {
      setLocationData((prev) => ({ ...prev, loading: true, error: null }));

      // Kiểm tra xem quyền đã được cấp hay chưa
      let { status } = await Location.getForegroundPermissionsAsync();

      // Nếu chưa được cấp quyền, yêu cầu quyền
      if (status !== "granted") {
        const response = await Location.requestForegroundPermissionsAsync();
        status = response.status;
      }

      if (status !== "granted") {
        // Thông báo rõ ràng và hướng dẫn cách cấp quyền
        Alert.alert(
          "Cần quyền truy cập vị trí",
          "Vui lòng cấp quyền truy cập vị trí để ứng dụng có thể xác định vị trí của bạn. Bạn có thể vào Cài đặt > Quyền để cấp quyền cho ứng dụng.",
          [
            {
              text: "Để sau",
              onPress: () => console.log("Permission denied"),
              style: "cancel",
            },
            {
              text: "Mở Cài đặt",
              onPress: () => {
                Location.enableNetworkProviderAsync().catch(() => {
                  Alert.alert(
                    "Không thể mở cài đặt",
                    "Vui lòng vào Cài đặt và cấp quyền vị trí cho ứng dụng."
                  );
                });
              },
            },
          ]
        );

        setLocationData((prev) => ({
          ...prev,
          error: "Quyền truy cập vị trí bị từ chối",
          loading: false,
        }));
        return false;
      }

      return true;
    } catch (error) {
      setLocationData((prev) => ({
        ...prev,
        error: "Không thể yêu cầu quyền truy cập vị trí",
        loading: false,
      }));
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      setLocationData((prev) => ({ ...prev, loading: true, error: null }));

      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setLocationData((prev) => ({
          ...prev,
          loading: false,
        }));
        return null;
      }

      // Kiểm tra vị trí có bật hay không
      const isLocationEnabled = await Location.hasServicesEnabledAsync();
      if (!isLocationEnabled) {
        Alert.alert(
          "Dịch vụ vị trí bị tắt",
          "Vui lòng bật dịch vụ vị trí trong cài đặt thiết bị của bạn để tiếp tục.",
          [
            {
              text: "Để sau",
              onPress: () => console.log("Location services denied"),
              style: "cancel",
            },
            {
              text: "Mở Cài đặt",
              onPress: () => {
                Location.enableNetworkProviderAsync().catch(() => {
                  Alert.alert(
                    "Không thể mở cài đặt",
                    "Vui lòng bật dịch vụ vị trí trong cài đặt thiết bị của bạn."
                  );
                });
              },
            },
          ]
        );
        setLocationData((prev) => ({
          ...prev,
          error: "Dịch vụ vị trí bị tắt",
          loading: false,
        }));
        return null;
      }

      // Lấy vị trí hiện tại với timeout
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        timeInterval: 1000,
      });

      const { latitude, longitude } = location.coords;

      // Lấy địa chỉ từ tọa độ
      const geocodeResults = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (!geocodeResults || geocodeResults.length === 0) {
        setLocationData((prev) => ({
          ...prev,
          error: "Không thể lấy thông tin địa chỉ từ vị trí",
          loading: false,
        }));
        return null;
      }

      const geocode = geocodeResults[0];
      console.log("Geocode result:", JSON.stringify(geocode, null, 2));

      // Tạo địa chỉ đầy đủ
      const address = formatAddress(geocode);

      // Tìm tỉnh thành phù hợp từ geocode
      let province = null;
      if (geocode.region) {
        province = provinces.find(
          (p) =>
            p.name
              .toLowerCase()
              .includes(geocode.region?.toLowerCase() || "") ||
            geocode.region?.toLowerCase().includes(p.name.toLowerCase())
        );
      }

      // Nếu không tìm thấy bằng region, thử với city
      if (!province && geocode.city) {
        province = provinces.find(
          (p) =>
            p.name.toLowerCase().includes(geocode.city?.toLowerCase() || "") ||
            geocode.city?.toLowerCase().includes(p.name.toLowerCase())
        );
      }

      // Tạo địa chỉ chi tiết từ các thông tin có sẵn
      let detailedAddress;

      // Ưu tiên sử dụng formattedAddress cho địa chỉ chi tiết
      if (geocode.formattedAddress) {
        detailedAddress = geocode.formattedAddress;
      } else {
        const parts = [
          geocode.name,
          geocode.street,
          geocode.district,
          geocode.subregion,
        ].filter(Boolean);

        detailedAddress = parts.join(", ");
      }

      // Đảm bảo formattedAddress và detailedAddress là giống nhau
      const formattedAddress = geocode.formattedAddress || null;

      setLocationData({
        latitude,
        longitude,
        address,
        error: null,
        loading: false,
        province: province || null,
        detailedAddress: formattedAddress || detailedAddress,
        formattedAddress,
      });

      return {
        latitude,
        longitude,
        address,
        province: province || null,
        detailedAddress: formattedAddress || detailedAddress,
        formattedAddress,
      };
    } catch (error) {
      console.error("Lỗi khi lấy vị trí:", error);
      setLocationData((prev) => ({
        ...prev,
        error: "Không thể lấy vị trí hiện tại",
        loading: false,
      }));
      Alert.alert(
        "Không thể lấy vị trí",
        "Có lỗi xảy ra khi lấy vị trí hiện tại. Vui lòng kiểm tra kết nối mạng và thử lại sau.",
        [{ text: "Đã hiểu" }]
      );
      return null;
    }
  };

  // Hàm định dạng địa chỉ từ kết quả geocode
  const formatAddress = (geocode: Location.LocationGeocodedAddress) => {
    // Ưu tiên sử dụng formattedAddress nếu có
    if (geocode.formattedAddress) {
      return geocode.formattedAddress;
    }

    // Nếu không có formattedAddress, tạo từ các thành phần
    const components = [
      geocode.name,
      geocode.street,
      geocode.district,
      geocode.city,
      geocode.region,
      geocode.country,
    ].filter(Boolean);

    return components.join(", ");
  };

  // Hàm cập nhật tỉnh được chọn
  const setProvince = (province: Province | null) => {
    setLocationData((prev) => ({
      ...prev,
      province,
    }));
  };

  // Hàm cập nhật địa chỉ chi tiết
  const setDetailedAddress = (address: string | null) => {
    setLocationData((prev) => ({
      ...prev,
      detailedAddress: address,
    }));
  };

  // Hàm lấy địa chỉ đầy đủ từ tỉnh và địa chỉ chi tiết
  const getFullAddress = () => {
    const components = [
      locationData.detailedAddress,
      locationData.province?.name,
    ].filter(Boolean);

    return components.join(", ");
  };

  return {
    ...locationData,
    provinces,
    loadingProvinces,
    getCurrentLocation,
    setProvince,
    setDetailedAddress,
    getFullAddress,
    fetchProvinces,
  };
};

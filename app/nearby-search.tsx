import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Dimensions,
  Platform,
  PermissionsAndroid,
  StatusBar as RNStatusBar,
  Animated,
  Linking,
} from "react-native";
import React, { useCallback, useEffect, useState, useRef } from "react";
import { Stack, router, useLocalSearchParams } from "expo-router";
import Ionicons from "@expo/vector-icons/Ionicons";
import ServiceCard from "@/components/ServiceCard";
import useRentoData from "@/stores/dataStore";
import RangeSlider from "@/components/RangeSlider";
import {
  ServiceWithDistance,
  fetchNearbyServicesByCoordinates,
  fetchNearbyServicesByProvince,
} from "@/types/nearby";
import { useLocation } from "@/hooks/useLocation";
import MapboxGL from "@rnmapbox/maps";
import { LocationObject } from "expo-location";
import { Link } from "expo-router";
import Slider from "@react-native-community/slider";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

// Kích thước màn hình
const { width, height } = Dimensions.get("window");

// Thiết lập token cho Mapbox
// Thay YOUR_MAPBOX_TOKEN_HERE bằng token thật của bạn nếu không dùng env
MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

export default function NearbySearch() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceWithDistance[]>([]);
  const [searchRadius, setSearchRadius] = useState(10);
  const [displayRadius, setDisplayRadius] = useState(10); // Chỉ để hiển thị trên UI
  const [showMap, setShowMap] = useState(true);
  const [selectedService, setSelectedService] =
    useState<ServiceWithDistance | null>(null);
  const [showRadius, setShowRadius] = useState(false);
  const [mapStyle, setMapStyle] = useState("light");
  const [mapVisible, setMapVisible] = useState(true);

  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const user = useRentoData((state) => state.user);
  const location = useLocation();

  // Ref cho bản đồ và camera
  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  // Sử dụng useRef để lưu trữ debounce timeout
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Sử dụng useRef để theo dõi trạng thái đã mount của component
  const isMountedRef = useRef(true);

  // Dùng useRef để lưu trữ giá trị thực của bán kính giúp tránh hiện tượng nháy
  const actualRadiusRef = useRef(10);

  // Animation value for popup
  const popupAnimation = useRef(new Animated.Value(0)).current;

  // Sử dụng state để theo dõi cả giá trị hiển thị và giá trị thực
  // Xin quyền truy cập vị trí (cho Android)
  const requestLocationPermission = async () => {
    if (Platform.OS === "android") {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Quyền truy cập vị trí",
            message:
              "Ứng dụng cần quyền truy cập vị trí để tìm kiếm dịch vụ gần bạn",
            buttonNeutral: "Hỏi lại sau",
            buttonNegative: "Từ chối",
            buttonPositive: "Chấp nhận",
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  // Hàm helper để fetch dữ liệu theo tọa độ
  const fetchByCoordinates = useCallback(
    async (
      lat: number,
      lng: number,
      radius: number,
      moveCamera: boolean = true
    ) => {
      if (!isMountedRef.current) return;

      try {
        setLoading(true);
        const results = await fetchNearbyServicesByCoordinates(
          lat,
          lng,
          radius
        );
        if (isMountedRef.current) {
          setServices(results);
          // Di chuyển camera đến vị trí hiện tại chỉ khi moveCamera = true
          if (moveCamera && cameraRef.current && results.length > 0) {
            cameraRef.current.setCamera({
              centerCoordinate: [lng, lat],
              zoomLevel: 13,
              animationDuration: 1000,
            });
          }
        }
      } catch (error) {
        console.error("Lỗi khi tìm dịch vụ gần đây:", error);
        if (isMountedRef.current) {
          Alert.alert("Lỗi", "Không thể tìm dịch vụ gần đây");
          setServices([]);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  // Hàm helper để fetch dữ liệu theo tỉnh
  const fetchByProvince = useCallback(async (provinceId: number) => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      const results = await fetchNearbyServicesByProvince(provinceId);
      if (isMountedRef.current) {
        setServices(results);
        // Nếu có dịch vụ và dịch vụ đầu tiên có tọa độ, di chuyển camera đến đó
        if (
          results.length > 0 &&
          results[0].location?.lng !== undefined &&
          results[0].location?.lat !== undefined
        ) {
          const firstService = results[0];
          const lng = firstService.location?.lng || 0;
          const lat = firstService.location?.lat || 0;
          cameraRef.current?.setCamera({
            centerCoordinate: [lng, lat],
            zoomLevel: 11,
            animationDuration: 1000,
          });
        }
      }
    } catch (error) {
      console.error("Lỗi khi tìm dịch vụ theo tỉnh:", error);
      if (isMountedRef.current) {
        Alert.alert("Lỗi", "Không thể tìm dịch vụ theo khu vực");
        setServices([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Khởi tạo vị trí và tìm kiếm ban đầu
  useEffect(() => {
    isMountedRef.current = true;
    // Theo dõi các timeout để cleanup
    const timeouts: NodeJS.Timeout[] = [];

    // Yêu cầu quyền vị trí và thiết lập Mapbox
    const setupMap = async () => {
      await requestLocationPermission();
      // Cho ios cần enable location services
      if (Platform.OS === "ios" && isMountedRef.current) {
        await MapboxGL.setTelemetryEnabled(false);
      }
    };

    setupMap();

    const initLocation = async () => {
      if (!isMountedRef.current) return;

      try {
        const currentLocation = await location.getCurrentLocation();

        if (!isMountedRef.current) return;

        if (currentLocation?.latitude && currentLocation?.longitude) {
          // Khi khởi tạo, cho phép di chuyển camera đến vị trí của người dùng (true)
          await fetchByCoordinates(
            currentLocation.latitude,
            currentLocation.longitude,
            searchRadius,
            true
          );
        } else if (user?.location?.province_id) {
          await fetchByProvince(user.location.province_id);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error("Lỗi khi khởi tạo vị trí:", error);

        if (!isMountedRef.current) return;

        if (user?.location?.province_id) {
          await fetchByProvince(user.location.province_id);
        } else {
          setLoading(false);
        }
      }
    };

    // Gọi initLocation khi component mount
    initLocation();

    // Cleanup khi component unmount
    return () => {
      isMountedRef.current = false;

      // Hủy bỏ timeout nếu có
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      // Xóa các timeout đã tạo
      timeouts.forEach(clearTimeout);

      // Đảm bảo tham chiếu đến mapRef và cameraRef bị xóa khi component unmount
      if (mapRef.current) {
        // @ts-ignore - Bỏ qua lỗi TypeScript vì chúng ta biết chắc chắn rằng đây là cách an toàn
        mapRef.current = null;
      }
      if (cameraRef.current) {
        // @ts-ignore
        cameraRef.current = null;
      }

      // Đảm bảo tất cả refs khác được reset
      // @ts-ignore
      radiusVisibleRef.current = false;
    };
  }, []); // Loại bỏ tất cả dependencies để chỉ chạy khi mount

  // Xử lý refresh - di chuyển camera (true) vì đây là thao tác do người dùng chủ động thực hiện
  const onRefresh = useCallback(async () => {
    if (location.latitude && location.longitude) {
      await fetchByCoordinates(
        location.latitude,
        location.longitude,
        searchRadius,
        true
      );
    } else if (user?.location?.province_id) {
      await fetchByProvince(user.location.province_id);
    }
  }, [location, user, searchRadius, fetchByCoordinates, fetchByProvince]);

  // Xử lý thay đổi bán kính tìm kiếm - sửa lỗi nháy nháy triệt để
  const handleRadiusChange = useCallback((value: number) => {
    // Chỉ cập nhật giá trị hiển thị, không cập nhật searchRadius để tránh re-render
    setDisplayRadius(Math.round(value));
    // Lưu vào ref để sử dụng khi cần
    actualRadiusRef.current = Math.round(value);
  }, []);

  // Tách biệt việc gọi API khi kết thúc kéo thanh trượt
  const handleSlidingComplete = useCallback(
    (value: number) => {
      const roundedValue = Math.round(value);

      // Kiểm tra nếu giá trị đã thay đổi để tránh gọi API không cần thiết
      if (roundedValue === searchRadius) return;

      // Cập nhật cả hai giá trị trong cùng một lần render để tránh re-render không cần thiết
      setSearchRadius(roundedValue);
      setDisplayRadius(roundedValue);

      // Reset showRadius khi thay đổi bán kính để tránh lỗi với bán kính cũ
      if (showRadius) {
        setShowRadius(false);
        // Sau 100ms, bật lại showRadius để có animation mượt mà
        const timeoutId = setTimeout(() => {
          if (isMountedRef.current) {
            setShowRadius(true);
          }
        }, 100);

        // Lưu timeout ID để có thể clear khi unmount
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = timeoutId;
      }

      // Chỉ gọi API nếu có vị trí, không di chuyển camera (false)
      if (location.latitude && location.longitude) {
        fetchByCoordinates(
          location.latitude,
          location.longitude,
          roundedValue,
          false
        );
      }
    },
    [location, fetchByCoordinates, searchRadius, showRadius]
  );

  // Xử lý yêu thích/hủy yêu thích
  const onPressFavorite = useCallback(
    (serviceId: number, action: string) => {
      if (serviceId) {
        updateFavorite(serviceId, action === "true");

        // Cập nhật state mà không phụ thuộc vào giá trị services hiện tại
        setServices((prevServices) =>
          prevServices.map((service) =>
            service.id === serviceId
              ? { ...service, is_liked: action === "true" }
              : service
          )
        );
      }
    },
    [updateFavorite]
  );

  // Thêm ref để theo dõi trạng thái hiển thị bán kính
  const radiusVisibleRef = useRef(false);

  // Cập nhật hàm xử lý hiển thị bán kính
  const toggleRadiusVisibility = useCallback(() => {
    // Cập nhật ref trước, sau đó mới cập nhật state để tránh race conditions
    radiusVisibleRef.current = !radiusVisibleRef.current;
    setShowRadius(radiusVisibleRef.current);
  }, []);

  // Tạo các marker cho bản đồ
  const renderMarkers = useCallback(() => {
    return services.map((service) => {
      if (!service.location?.lng || !service.location?.lat) return null;

      // Tạo key duy nhất cho marker
      const markerKey = `marker-${service.id}-${service.location.lng.toFixed(6)}-${service.location.lat.toFixed(6)}`;

      return (
        <MapboxGL.MarkerView
          key={markerKey}
          id={`marker-${service.id}`}
          coordinate={[service.location.lng, service.location.lat]}
          anchor={{ x: 0.5, y: 1 }}
        >
          <TouchableOpacity
            onPressIn={() => {
              // Khi nhấn vào marker, đặt dịch vụ được chọn để hiển thị popup
              handleMarkerPress(service);
            }}
            style={styles.markerContainer}
          >
            <View
              style={[
                styles.marker,
                selectedService?.id === service.id && styles.selectedMarker,
              ]}
            >
              <View style={styles.markerIcon}>
                <Ionicons
                  name="home"
                  size={selectedService?.id === service.id ? 20 : 18}
                  color="#fff"
                />
              </View>
              <View style={styles.markerPin} />
            </View>
            {selectedService?.id === service.id && (
              <View style={styles.markerLabel}>
                <Text style={styles.markerText} numberOfLines={1}>
                  {service.service_name}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </MapboxGL.MarkerView>
      );
    });
  }, [services, selectedService, handleMarkerPress]);

  // Render các nút điều khiển trên bản đồ
  const renderMapControls = useCallback(() => {
    return (
      <View style={styles.mapControlsContainer}>
        <TouchableOpacity
          style={styles.mapControlButton}
          onPressIn={() => {
            if (location.latitude && location.longitude) {
              cameraRef.current?.setCamera({
                centerCoordinate: [location.longitude, location.latitude],
                zoomLevel: 14,
                animationDuration: 1000,
              });
            } else {
              Alert.alert("Thông báo", "Không thể xác định vị trí của bạn.");
            }
          }}
        >
          <Ionicons name="navigate" size={22} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.mapControlButton}
          onPressIn={() => setMapStyle(mapStyle === "light" ? "dark" : "light")}
        >
          <Ionicons
            name={mapStyle === "light" ? "moon" : "sunny"}
            size={22}
            color="#333"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mapControlButton,
            showRadius && styles.mapControlButtonActive,
          ]}
          onPressIn={toggleRadiusVisibility}
        >
          <Ionicons
            name="radio"
            size={22}
            color={showRadius ? "#fff" : "#333"}
          />
        </TouchableOpacity>

        {selectedService && (
          <TouchableOpacity
            style={[
              styles.mapControlButton,
              !selectedService && styles.mapControlButtonActive,
            ]}
            onPressIn={() => setSelectedService(null)}
          >
            <Ionicons
              name="close"
              size={22}
              color={!selectedService ? "#fff" : "#333"}
            />
          </TouchableOpacity>
        )}
      </View>
    );
  }, [
    location.latitude,
    location.longitude,
    mapStyle,
    showRadius,
    toggleRadiusVisibility,
    selectedService,
  ]);

  // Render vòng tròn bán kính tìm kiếm với kích thước chính xác sử dụng công thức Haversine
  const renderRadiusCircle = useCallback(() => {
    if (!showRadius || !location.latitude || !location.longitude) return null;

    // Tạo vòng tròn GeoJSON với bán kính chính xác sử dụng công thức Haversine
    const createGeoJSONCircle = (
      center: [number, number],
      radiusInKm: number
    ) => {
      if (radiusInKm <= 0) return null;

      const points = 128; // Tăng số điểm để đường tròn mịn hơn
      const centerLng = center[0];
      const centerLat = center[1];

      // Hằng số bán kính trái đất (km)
      const R = 6371;

      const polygon = [];

      // Tạo vòng tròn dựa trên công thức Haversine (cùng công thức với backend)
      for (let i = 0; i < points; i++) {
        const angle = (i * 2 * Math.PI) / points;

        // Tính toán điểm trên vòng tròn bằng công thức Haversine nghịch đảo
        // Công thức này cho phép tìm một điểm cách điểm trung tâm một khoảng cách xác định
        // theo một hướng nhất định
        const dx = radiusInKm * Math.cos(angle);
        const dy = radiusInKm * Math.sin(angle);

        // Chuyển đổi khoảng cách dx, dy sang tọa độ (lng, lat)
        // Công thức này đảm bảo khoảng cách Haversine chính xác
        const latRad = (centerLat * Math.PI) / 180;

        // Tính toán tọa độ điểm mới (tính bằng radian)
        const dLat = dy / R;
        const dLng = dx / (R * Math.cos(latRad));

        // Chuyển sang độ
        const newLatRad = latRad + dLat;
        const newLat = (newLatRad * 180) / Math.PI;
        const newLng = centerLng + (dLng * 180) / Math.PI;

        polygon.push([newLng, newLat]);
      }

      // Đóng đa giác (điểm cuối = điểm đầu)
      polygon.push(polygon[0]);

      return {
        type: "Feature" as const,
        geometry: {
          type: "Polygon" as const,
          coordinates: [polygon],
        },
        properties: {},
      };
    };

    // Không cần giới hạn bán kính hiển thị, để hiển thị đúng với kết quả tìm kiếm
    const circleData = createGeoJSONCircle(
      [location.longitude, location.latitude],
      searchRadius
    );

    if (!circleData) return null;

    // Sử dụng key để buộc re-render khi cần thiết, tránh lỗi ViewTagResolver
    const sourceKey = `circle-source-${searchRadius}-${location.latitude.toFixed(6)}-${location.longitude.toFixed(6)}`;

    return (
      <MapboxGL.ShapeSource
        id="circleSource"
        key={sourceKey}
        shape={circleData}
      >
        <MapboxGL.FillLayer
          id="circleFill"
          style={{
            fillColor: "#0286FF",
            fillOpacity: 0.2,
          }}
        />
        <MapboxGL.LineLayer
          id="circleOutline"
          style={{
            lineColor: "#0286FF",
            lineWidth: 2,
            lineOpacity: 0.5,
          }}
        />
      </MapboxGL.ShapeSource>
    );
  }, [showRadius, location.latitude, location.longitude, searchRadius]);

  // Render nội dung của bản đồ
  const renderMap = useCallback(() => {
    if (!mapVisible) return null;

    // Tính toán vị trí và style tùy chỉnh cho popup
    // Luôn hiển thị ở giữa màn hình
    const popupPosition = {
      top: height * 0.15,
      bottom: undefined,
      left: width * 0.05,
      right: width * 0.05,
      maxHeight: height * 0.7,
    };

    return (
      <View style={styles.mapContainer}>
        <MapboxGL.MapView
          ref={mapRef}
          styleURL={
            mapStyle === "light"
              ? MapboxGL.StyleURL.Street
              : MapboxGL.StyleURL.Dark
          }
          style={styles.map}
          logoEnabled={false}
          attributionEnabled={false}
          compassEnabled={true}
          onPress={() => handleClosePopup()}
        >
          <MapboxGL.Camera
            ref={cameraRef}
            zoomLevel={12}
            centerCoordinate={
              location.latitude && location.longitude
                ? [location.longitude, location.latitude]
                : [106.660172, 10.762622] // Tọa độ mặc định (TP. HCM)
            }
            animationMode="flyTo"
            animationDuration={1000}
          />

          {/* Hiện vị trí người dùng hiện tại */}
          {location.latitude && location.longitude && (
            <MapboxGL.UserLocation visible={true} />
          )}

          {/* Hiển thị các marker cho các dịch vụ */}
          {renderMarkers()}

          {/* Render vòng tròn bán kính tìm kiếm */}
          {renderRadiusCircle()}
        </MapboxGL.MapView>

        {/* Hiển thị lớp mờ phía sau khi popup hiển thị */}
        {selectedService && (
          <Animated.View
            style={[
              styles.backdrop,
              {
                opacity: popupAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, 0.5],
                }),
              },
            ]}
          />
        )}

        {/* Các nút điều khiển bản đồ */}
        {renderMapControls()}

        {/* Card hiển thị thông tin dịch vụ được chọn */}
        {selectedService && (
          <Animated.View
            style={[
              styles.selectedServiceCard,
              styles.centeredCard,
              {
                transform: [
                  {
                    translateY: popupAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-100, 0],
                    }),
                  },
                ],
                opacity: popupAnimation,
                top: popupPosition.top,
                bottom: popupPosition.bottom,
                left: popupPosition.left,
                right: popupPosition.right,
                maxHeight: popupPosition.maxHeight,
              },
            ]}
          >
            <TouchableOpacity
              style={[styles.closeButton, styles.centeredCloseButton]}
              onPressIn={handleClosePopup}
            >
              <Ionicons name="close-circle" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/job/[id]",
                  params: {
                    id: selectedService.id,
                    user_name: selectedService.user?.name,
                    category_name: selectedService.category?.category_name,
                  },
                })
              }
            >
              <View style={styles.popupHeader}>
                <View style={styles.popupDistance}>
                  {selectedService.distance !== undefined && (
                    <View style={styles.distanceBadge}>
                      <Ionicons name="location" size={16} color="#0286FF" />
                      <Text style={styles.popupDistanceText}>
                        {selectedService.distance < 1
                          ? `${Math.round(selectedService.distance * 1000)} m`
                          : `${selectedService.distance.toFixed(1)} km`}
                      </Text>
                    </View>
                  )}
                  {selectedService.location?.lat &&
                    selectedService.location?.lng && (
                      <TouchableOpacity
                        style={styles.openMapsButton}
                        onPress={() =>
                          openInMaps(
                            selectedService.location!.lat,
                            selectedService.location!.lng,
                            selectedService.service_name
                          )
                        }
                      >
                        <Ionicons
                          name={
                            location.latitude && location.longitude
                              ? "navigate-circle"
                              : "map"
                          }
                          size={16}
                          color="#0286FF"
                        />
                        <Text style={styles.openMapsText}>
                          {location.latitude && location.longitude
                            ? "Chỉ đường"
                            : "Mở bản đồ"}
                        </Text>
                      </TouchableOpacity>
                    )}
                </View>
              </View>
              <ServiceCard
                data={selectedService}
                onPressFavorite={() =>
                  onPressFavorite(
                    selectedService.id,
                    (!selectedService.is_liked).toString()
                  )
                }
              />
              <View style={styles.viewDetailButton}>
                <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                <Ionicons name="arrow-forward" size={16} color="#0286FF" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}
      </View>
    );
  }, [
    mapVisible,
    mapStyle,
    location.latitude,
    location.longitude,
    selectedService,
    renderMapControls,
    renderMarkers,
    renderRadiusCircle,
    onPressFavorite,
    popupAnimation,
    handleClosePopup,
    openInMaps,
  ]);

  // Thêm hàm để xử lý việc mở bản đồ và đi đến vị trí dịch vụ
  const viewServiceOnMap = useCallback(
    (service: ServiceWithDistance) => {
      if (!service.location?.lat || !service.location?.lng) return;

      // Đóng popup nếu đang mở
      if (selectedService) {
        handleClosePopup();
      }

      // Chuyển sang chế độ xem bản đồ
      setMapVisible(true);

      // Sử dụng setTimeout để đảm bảo bản đồ đã load và animation trước đó đã hoàn tất
      setTimeout(() => {
        if (!isMountedRef.current) return;

        // Đặt dịch vụ được chọn
        setSelectedService(service);

        // Di chuyển camera đến vị trí dịch vụ
        if (cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: [service.location!.lng, service.location!.lat],
            zoomLevel: 15,
            animationDuration: 800,
          });
        }

        // Animate popup in
        Animated.spring(popupAnimation, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }).start();
      }, 300);
    },
    [selectedService, handleClosePopup, popupAnimation]
  );

  // Render danh sách dịch vụ
  const renderItem = ({ item }: { item: ServiceWithDistance }) => (
    <View style={styles.serviceCard}>
      <View style={styles.serviceCardHeader}>
        <View style={styles.serviceHeaderLeft}>
          {item.distance !== undefined && (
            <View style={styles.serviceDistance}>
              <Ionicons name="location" size={14} color="#0286FF" />
              <Text style={styles.distanceText}>
                {item.distance < 1
                  ? `${Math.round(item.distance * 1000)} m`
                  : `${item.distance.toFixed(1)} km`}
              </Text>
            </View>
          )}
        </View>
        {item.location?.lat && item.location?.lng && (
          <TouchableOpacity
            style={styles.viewOnMapButton}
            onPress={() => viewServiceOnMap(item)}
          >
            <Ionicons
              name="navigate-circle-outline"
              size={16}
              color="#0286FF"
            />
            <Text style={styles.viewOnMapText}>Xem trên bản đồ</Text>
          </TouchableOpacity>
        )}
      </View>
      <ServiceCard
        data={item}
        onPressFavorite={() =>
          onPressFavorite(item.id, (!item.is_liked).toString())
        }
      />
    </View>
  );

  // Hàm mở bản đồ bên ngoài (Google Maps hoặc Apple Maps)
  const openInMaps = useCallback((lat: number, lng: number, name: string) => {
    const scheme = Platform.OS === "ios" ? "maps:" : "geo:";
    const url =
      Platform.OS === "ios"
        ? `${scheme}?q=${name}&ll=${lat},${lng}`
        : `${scheme}${lat},${lng}?q=${name}`;

    Linking.canOpenURL(url).then((supported) => {
      if (supported) {
        Linking.openURL(url);
      } else {
        // Fallback cho trường hợp không mở được ứng dụng bản đồ
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(googleMapsUrl);
      }
    });
  }, []);

  // Xử lý khi chọn một marker trên bản đồ
  const handleMarkerPress = useCallback(
    (service: ServiceWithDistance) => {
      setSelectedService(service);
      // Animate popup in
      Animated.spring(popupAnimation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();

      // Di chuyển camera đến vị trí của dịch vụ được chọn
      if (cameraRef.current && service.location?.lng && service.location?.lat) {
        cameraRef.current.setCamera({
          centerCoordinate: [service.location.lng, service.location.lat],
          zoomLevel: 15,
          animationDuration: 500,
        });
      }
    },
    [popupAnimation]
  );

  // Xử lý đóng popup
  const handleClosePopup = useCallback(() => {
    // Animate popup out
    Animated.timing(popupAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Sau khi animation kết thúc, mới reset selectedService
      setSelectedService(null);
    });
  }, [popupAnimation]);

  // Tự động ẩn thanh bán kính khi hiển thị popup
  useEffect(() => {
    if (selectedService) {
      // Lưu trạng thái của thanh bán kính trước khi ẩn
      const previousRadiusState = showRadius;
      setShowRadius(false);

      return () => {
        // Khôi phục trạng thái của thanh bán kính khi popup đóng
        if (isMountedRef.current) {
          setShowRadius(previousRadiusState);
        }
      };
    }
  }, [selectedService]);

  // Xử lý chuyển đổi giữa chế độ xem bản đồ và danh sách
  const toggleView = useCallback(() => {
    setShowMap((prev) => !prev);
  }, []);

  // Format khoảng cách hiển thị
  const formatDistance = useCallback((distance: number | undefined) => {
    if (distance === undefined) return null;
    return distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(1)} km`;
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Link href="/home" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
          </Link>
          <Text style={styles.title}>Tìm quanh đây</Text>
        </View>
        <TouchableOpacity
          style={styles.viewModeButton}
          onPressIn={() => setMapVisible(!mapVisible)}
        >
          <Ionicons name={mapVisible ? "list" : "map"} size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Map View */}
      {renderMap()}

      {/* List View */}
      {!mapVisible && (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={onRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {loading
                  ? "Đang tìm kiếm dịch vụ..."
                  : "Không tìm thấy dịch vụ nào trong khu vực này"}
              </Text>
            </View>
          }
        />
      )}

      {/* Radius Slider - đã di chuyển xuống dưới */}
      {mapVisible && (
        <View style={styles.bottomRadiusContainer}>
          <View style={styles.radiusHeader}>
            <Text style={styles.radiusLabel}>
              Bán kính:{" "}
              <Text style={styles.radiusValue}>{displayRadius} km</Text>
            </Text>
            <View style={styles.locationInfo}>
              {location.loading ? (
                <ActivityIndicator size="small" color="#0286FF" />
              ) : location.error ? (
                <View style={styles.locationErrorBadge}>
                  <Ionicons name="warning-outline" size={14} color="#FFA500" />
                  <Text style={styles.locationErrorText}>Lỗi định vị</Text>
                </View>
              ) : (
                <View style={styles.locationBadge}>
                  <Ionicons name="location" size={14} color="#0286FF" />
                  <Text style={styles.locationText}>Đã định vị</Text>
                </View>
              )}
            </View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={100}
            step={1}
            value={searchRadius}
            onValueChange={handleRadiusChange}
            onSlidingComplete={handleSlidingComplete}
            minimumTrackTintColor="#0286FF"
            maximumTrackTintColor="#D9D9D9"
            thumbTintColor="#0286FF"
            tapToSeek={true}
          />
          <View style={styles.radiusMarkers}>
            <Text style={styles.radiusMarkerText}>1km</Text>
            <Text style={styles.radiusMarkerText}>50km</Text>
            <Text style={styles.radiusMarkerText}>100km</Text>
          </View>
        </View>
      )}

      {/* Loading Indicator */}
      {loading && (
        <View
          style={[
            styles.loadingOverlay,
            mapVisible && styles.mapLoadingOverlay,
          ]}
        >
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0286FF" />
            <Text style={styles.loadingText}>Đang tìm kiếm dịch vụ...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  viewModeButton: {
    backgroundColor: "#0286FF",
    padding: 8,
    borderRadius: 8,
    marginLeft: "auto",
  },
  mapContainer: {
    flex: 1,
    position: "relative",
  },
  map: {
    flex: 1,
  },
  markerContainer: {
    alignItems: "center",
    width: 48,
    height: 70,
  },
  marker: {
    alignItems: "center",
    justifyContent: "center",
  },
  markerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 6,
    borderWidth: 2.5,
    borderColor: "#fff",
  },
  markerPin: {
    width: 18,
    height: 18,
    backgroundColor: "#FF3B30",
    transform: [{ rotate: "45deg" }],
    marginTop: -9,
    borderRightWidth: 2.5,
    borderBottomWidth: 2.5,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 2,
    elevation: 4,
  },
  selectedMarker: {
    transform: [{ scale: 1.2 }],
    zIndex: 10,
  },
  markerLabel: {
    backgroundColor: "white",
    borderRadius: 4,
    padding: 5,
    maxWidth: 150,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#333",
  },
  selectedServiceCard: {
    position: "absolute",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 12,
    padding: 2,
  },
  centeredCloseButton: {
    backgroundColor: "rgba(0,0,0,0.2)",
    padding: 5,
    borderRadius: 20,
  },
  mapControlsContainer: {
    position: "absolute",
    bottom: 140,
    right: 10,
    gap: 10,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  mapControlButtonActive: {
    backgroundColor: "#0286FF",
  },
  listContainer: {
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "gray",
  },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.8)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 2000,
  },
  mapLoadingOverlay: {
    backgroundColor: "rgba(0, 0, 0, 0.3)",
  },
  loadingContainer: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: "white",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: "500",
  },
  serviceCard: {
    marginBottom: 10,
    backgroundColor: "#fff",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  serviceCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 8,
    paddingBottom: 2,
  },
  serviceHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  serviceDistance: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 134, 255, 0.08)",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  distanceText: {
    fontWeight: "500",
    fontSize: 12,
    color: "#0286FF",
    marginLeft: 4,
  },
  viewOnMapButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(2, 134, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(2, 134, 255, 0.2)",
  },
  viewOnMapText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0286FF",
    marginLeft: 4,
  },
  bottomRadiusContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "#eee",
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 5,
    zIndex: 1000,
  },
  radiusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  radiusLabel: {
    fontSize: 14,
    fontWeight: "500",
  },
  radiusValue: {
    color: "#0286FF",
    fontWeight: "bold",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 134, 255, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationErrorBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 165, 0, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  locationText: {
    fontSize: 12,
    color: "#0286FF",
    marginLeft: 4,
  },
  locationErrorText: {
    fontSize: 12,
    color: "#FFA500",
    marginLeft: 4,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  radiusMarkers: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  radiusMarkerText: {
    fontSize: 12,
    color: "#666",
  },
  viewDetailButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(2, 134, 255, 0.1)",
    borderRadius: 10,
    margin: 5,
    marginTop: 0,
    padding: 10,
  },
  viewDetailText: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#0286FF",
    marginRight: 4,
  },
  popupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    padding: 5,
    paddingHorizontal: 10,
  },
  popupDistance: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  distanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(2, 134, 255, 0.08)",
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  popupDistanceText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0286FF",
    marginLeft: 4,
  },
  openMapsButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "rgba(2, 134, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(2, 134, 255, 0.2)",
  },
  openMapsText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#0286FF",
    marginLeft: 4,
  },
  backdrop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "black",
    zIndex: 10, // Đảm bảo nằm trên bản đồ nhưng dưới popup
  },
  centeredCard: {
    zIndex: 11, // Đảm bảo popup nằm trên backdrop
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

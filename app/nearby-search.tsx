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
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Modal,
  TextInput,
  ScrollView,
} from "react-native";
import React, {
  useCallback,
  useEffect,
  useState,
  useRef,
  useMemo,
} from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { SearchBar } from "react-native-screens";
import InputField from "@/components/InputField";
import { searchFilter, formatToVND } from "@/utils/utils";
import { CategoryType } from "@/types/type";
import { SelectList } from "react-native-dropdown-select-list";
import { FilterType, SortOption, defaultFilters } from "@/types/filter";

const { width, height } = Dimensions.get("window");

MapboxGL.setAccessToken(process.env.EXPO_PUBLIC_MAPBOX_TOKEN || "");

export default function NearbySearch() {
  const params = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceWithDistance[]>([]);
  const [originalServices, setOriginalServices] = useState<
    ServiceWithDistance[]
  >([]);
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [searchRadius, setSearchRadius] = useState(10);
  const [displayRadius, setDisplayRadius] = useState(10);
  const [showMap, setShowMap] = useState(true);
  const [selectedService, setSelectedService] =
    useState<ServiceWithDistance | null>(null);
  const [showRadius, setShowRadius] = useState(false);
  const [mapStyle, setMapStyle] = useState("light");
  const [mapVisible, setMapVisible] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [listSheetExpanded, setListSheetExpanded] = useState(false);
  const listSheetAnimation = useRef(new Animated.Value(0)).current;

  // New filter state
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [filters, setFilters] = useState<FilterType>(defaultFilters);
  const [localFilters, setLocalFilters] = useState<FilterType>(defaultFilters);
  const [priceRangeMin, setPriceRangeMin] = useState("0");
  const [priceRangeMax, setPriceRangeMax] = useState("10000000");

  // Filter applied indicator
  const hasActiveFilters = useMemo(() => {
    return (
      filters.categories.length > 0 ||
      filters.ratings.length > 0 ||
      filters.priceRange.min > 0 ||
      filters.priceRange.max < 10000000 ||
      filters.sortBy !== null
    );
  }, [filters]);

  // Add filtered services based on all filters
  const filteredServices = useMemo(() => {
    if (searchText.trim().length > 0) {
      return originalServices.filter((service) =>
        searchFilter(service.service_name, searchText)
      );
    } else {
      return originalServices
        .filter((service) => {
          // Category filter
          const matchesCategory =
            filters.categories.length === 0 ||
            (service.category &&
              filters.categories.includes(service.category.id));

          // Rating filter
          const serviceRating = Math.round(service.average_rate || 0);
          const matchesRating =
            filters.ratings.length === 0 ||
            filters.ratings.includes(serviceRating);

          // Price filter
          const hasPrice = service.price && service.price.length > 0;
          const matchesPrice = !hasPrice
            ? filters.priceRange.min === 0
            : service.price?.some(
                (p) =>
                  p.price_value >= filters.priceRange.min &&
                  p.price_value <= filters.priceRange.max
              );

          return matchesCategory && matchesRating && matchesPrice;
        })
        .sort((a, b) => {
          // Apply sorting
          if (filters.sortBy === "rating") {
            return (b.average_rate || 0) - (a.average_rate || 0);
          } else if (filters.sortBy === "price_asc") {
            const minPriceA =
              a.price && a.price.length > 0
                ? Math.min(...a.price.map((p) => p.price_value))
                : 0;
            const minPriceB =
              b.price && b.price.length > 0
                ? Math.min(...b.price.map((p) => p.price_value))
                : 0;
            return minPriceA - minPriceB;
          } else if (filters.sortBy === "price_desc") {
            const maxPriceA =
              a.price && a.price.length > 0
                ? Math.max(...a.price.map((p) => p.price_value))
                : 0;
            const maxPriceB =
              b.price && b.price.length > 0
                ? Math.max(...b.price.map((p) => p.price_value))
                : 0;
            return maxPriceB - maxPriceA;
          } else if (filters.sortBy === "newest") {
            return (
              new Date(b.created_at || 0).getTime() -
              new Date(a.created_at || 0).getTime()
            );
          }

          // Default: sort by distance
          return (a.distance || 0) - (b.distance || 0);
        });
    }
  }, [originalServices, searchText, filters]);

  useEffect(() => {
    setServices(filteredServices || []);
  }, [filteredServices]);

  // Apply filters function
  const applyFilters = useCallback(() => {
    const newMinPrice = parseInt(priceRangeMin) || 0;
    const newMaxPrice = parseInt(priceRangeMax) || 10000000;

    setFilters({
      ...localFilters,
      priceRange: {
        min: newMinPrice,
        max: newMaxPrice,
      },
    });
    setShowFilterModal(false);
  }, [localFilters, priceRangeMin, priceRangeMax]);

  // Clear all filters function
  const clearAllFilters = useCallback(() => {
    setLocalFilters({ ...defaultFilters });
    setPriceRangeMin("0");
    setPriceRangeMax("10000000");
  }, []);

  // Toggle a rating in filter
  const toggleRating = useCallback((rating: number) => {
    setLocalFilters((prev) => {
      const newRatings = prev.ratings.includes(rating)
        ? prev.ratings.filter((r) => r !== rating)
        : [...prev.ratings, rating];
      return { ...prev, ratings: newRatings };
    });
  }, []);

  // Toggle a category in filter
  const toggleCategory = useCallback((categoryId: number) => {
    setLocalFilters((prev) => {
      const newCategories = prev.categories.includes(categoryId)
        ? prev.categories.filter((id) => id !== categoryId)
        : [...prev.categories, categoryId];
      return { ...prev, categories: newCategories };
    });
  }, []);

  // Set sort option
  const setSortOption = useCallback((option: SortOption) => {
    setLocalFilters((prev) => ({
      ...prev,
      sortBy: prev.sortBy === option ? null : option,
    }));
  }, []);

  useEffect(() => {
    if (searchText.trim().length > 0) {
      setServices(
        originalServices.filter((service) =>
          searchFilter(service.service_name, searchText)
        )
      );
    } else {
      setServices(originalServices);
    }
  }, [searchText]);

  useEffect(() => {
    // Extract all categories from services
    const extractedCategories = originalServices
      .map((service) => service.category)
      .filter((category): category is CategoryType => category !== undefined);

    // Create a map to deduplicate categories by ID
    const uniqueCategoriesMap = new Map<number, CategoryType>();

    // Add each category to the map using its ID as the key
    extractedCategories.forEach((category) => {
      if (category && !uniqueCategoriesMap.has(category.id)) {
        uniqueCategoriesMap.set(category.id, category);
      }
    });

    // Convert the map values back to an array
    const uniqueCategories = Array.from(uniqueCategoriesMap.values());

    setCategories(uniqueCategories);
  }, [originalServices]);

  const updateFavorite = useRentoData((state) => state.updateFavorite);
  const user = useRentoData((state) => state.user);
  const location = useLocation();

  const mapRef = useRef<MapboxGL.MapView>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);

  const actualRadiusRef = useRef(10);

  const popupAnimation = useRef(new Animated.Value(0)).current;

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
          setOriginalServices(results);
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
          setOriginalServices([]);
        }
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    },
    []
  );

  const fetchByProvince = useCallback(async (provinceId: number) => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      const results = await fetchNearbyServicesByProvince(provinceId);
      if (isMountedRef.current) {
        setServices(results);
        setOriginalServices(results);
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
        setOriginalServices([]);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    const timeouts: NodeJS.Timeout[] = [];

    const setupMap = async () => {
      await requestLocationPermission();
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

    initLocation();

    return () => {
      isMountedRef.current = false;

      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
        debounceTimeoutRef.current = null;
      }

      timeouts.forEach(clearTimeout);

      if (mapRef.current) {
        // @ts-ignore
        mapRef.current = null;
      }
      if (cameraRef.current) {
        // @ts-ignore
        cameraRef.current = null;
      }

      // @ts-ignore
      radiusVisibleRef.current = false;
    };
  }, []);

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

  const handleRadiusChange = useCallback((value: number) => {
    setDisplayRadius(Math.round(value));
    actualRadiusRef.current = Math.round(value);
  }, []);

  const handleSlidingComplete = useCallback(
    (value: number) => {
      const roundedValue = Math.round(value);

      if (roundedValue === searchRadius) return;

      setSearchRadius(roundedValue);
      setDisplayRadius(roundedValue);

      if (showRadius) {
        setShowRadius(false);
        const timeoutId = setTimeout(() => {
          if (isMountedRef.current) {
            setShowRadius(true);
          }
        }, 100);

        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
        debounceTimeoutRef.current = timeoutId;
      }

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

  const onPressFavorite = useCallback(
    (serviceId: number, action: string) => {
      if (serviceId) {
        updateFavorite(serviceId, action === "true");

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

  const radiusVisibleRef = useRef(false);

  const toggleRadiusVisibility = useCallback(() => {
    radiusVisibleRef.current = !radiusVisibleRef.current;
    setShowRadius(radiusVisibleRef.current);
  }, []);

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
        const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        Linking.openURL(googleMapsUrl);
      }
    });
  }, []);

  const handleClosePopup = useCallback(() => {
    Animated.timing(popupAnimation, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setSelectedService(null);
    });
  }, [popupAnimation]);

  const handleMarkerPress = useCallback(
    (service: ServiceWithDistance) => {
      setSelectedService(service);
      Animated.spring(popupAnimation, {
        toValue: 1,
        useNativeDriver: true,
        friction: 8,
      }).start();

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

  const renderMarkers = useCallback(() => {
    return services.map((service) => {
      if (!service.location?.lng || !service.location?.lat) return null;

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
            onPressIn={handleClosePopup}
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
    handleClosePopup,
  ]);

  const renderRadiusCircle = useCallback(() => {
    if (!showRadius || !location.latitude || !location.longitude) return null;

    const createGeoJSONCircle = (
      center: [number, number],
      radiusInKm: number
    ) => {
      if (radiusInKm <= 0) return null;

      const points = 128;
      const centerLng = center[0];
      const centerLat = center[1];

      const R = 6371;

      const polygon = [];

      for (let i = 0; i < points; i++) {
        const angle = (i * 2 * Math.PI) / points;

        const dx = radiusInKm * Math.cos(angle);
        const dy = radiusInKm * Math.sin(angle);

        const latRad = (centerLat * Math.PI) / 180;

        const dLat = dy / R;
        const dLng = dx / (R * Math.cos(latRad));

        const newLatRad = latRad + dLat;
        const newLat = (newLatRad * 180) / Math.PI;
        const newLng = centerLng + (dLng * 180) / Math.PI;

        polygon.push([newLng, newLat]);
      }

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

    const circleData = createGeoJSONCircle(
      [location.longitude, location.latitude],
      searchRadius
    );

    if (!circleData) return null;

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

  const renderMap = useCallback(() => {
    if (!mapVisible) return null;

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
                : [106.660172, 10.762622]
            }
            animationMode="flyTo"
            animationDuration={1000}
          />

          {location.latitude && location.longitude && (
            <MapboxGL.UserLocation visible={true} />
          )}

          {renderMarkers()}

          {renderRadiusCircle()}
        </MapboxGL.MapView>

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

        {renderMapControls()}

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
                top: height * 0.15,
                left: width * 0.05,
                right: width * 0.05,
                maxHeight: height * 0.7,
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
              <ServiceCard data={selectedService} />
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
    height,
    width,
  ]);

  const viewServiceOnMap = useCallback(
    (service: ServiceWithDistance) => {
      if (!service.location?.lat || !service.location?.lng) return;

      if (selectedService) {
        handleClosePopup();
      }

      setListSheetExpanded(false);
      Animated.timing(listSheetAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();

      setMapVisible(true);

      setTimeout(() => {
        if (!isMountedRef.current) return;

        setSelectedService(service);

        if (cameraRef.current) {
          cameraRef.current.setCamera({
            centerCoordinate: [service.location!.lng, service.location!.lat],
            zoomLevel: 15,
            animationDuration: 800,
          });
        }

        Animated.spring(popupAnimation, {
          toValue: 1,
          useNativeDriver: true,
          friction: 8,
        }).start();
      }, 300);
    },
    [selectedService, handleClosePopup, popupAnimation]
  );

  const renderItem = ({
    item,
    index,
  }: {
    item: ServiceWithDistance;
    index: number;
  }) => (
    <View
      style={[
        styles.serviceCard,
        !listSheetExpanded && index < 2 ? { zIndex: 10 } : {},
      ]}
    >
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
      <ServiceCard data={item} />
    </View>
  );

  useEffect(() => {
    if (selectedService) {
      const previousRadiusState = showRadius;
      setShowRadius(false);

      return () => {
        if (isMountedRef.current) {
          setShowRadius(previousRadiusState);
        }
      };
    }
  }, [selectedService]);

  const toggleView = useCallback(() => {
    setShowMap((prev) => !prev);
  }, []);

  const formatDistance = useCallback((distance: number | undefined) => {
    if (distance === undefined) return null;
    return distance < 1
      ? `${Math.round(distance * 1000)} m`
      : `${distance.toFixed(1)} km`;
  }, []);

  const panResponderRef = useRef<any>(null);

  const startDragPositionRef = useRef(0);
  const initialSheetPositionRef = useRef(0);

  // Add a new state to track fullscreen mode
  const [listSheetFullscreen, setListSheetFullscreen] = useState(false);

  // Update toggle function with improved animation settings
  const toggleListSheet = useCallback(() => {
    if (listSheetFullscreen) {
      setListSheetFullscreen(false);
      setListSheetExpanded(true);
      Animated.timing(listSheetAnimation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else if (listSheetExpanded) {
      setListSheetExpanded(false);
      Animated.timing(listSheetAnimation, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      setListSheetExpanded(true);
      Animated.timing(listSheetAnimation, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [listSheetExpanded, listSheetFullscreen, listSheetAnimation]);

  useEffect(() => {
    panResponderRef.current = PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 2;
      },
      onPanResponderGrant: () => {
        listSheetAnimation.stopAnimation((value) => {
          initialSheetPositionRef.current = value;
        });
      },
      onPanResponderMove: (_, gestureState) => {
        const dragDistance = gestureState.dy / (height * 0.4);

        // For smoother animation that responds immediately to the user's drag
        const newPosition = Math.max(
          0,
          Math.min(2, initialSheetPositionRef.current - dragDistance)
        );

        // Use setValue for instant update without animation
        listSheetAnimation.setValue(newPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        const isDraggingDown = gestureState.vy > 0;
        const isMovingFast = Math.abs(gestureState.vy) > 0.3;

        // Current animation position
        const currentPosition = listSheetAnimation._value;

        // Updated thresholds to make the list sheet more "sticky" in the middle position
        if (isDraggingDown) {
          // Dragging down - only collapse if dragged very far down or with high velocity
          if (
            currentPosition < 0.2 ||
            (isMovingFast && gestureState.vy > 1.5)
          ) {
            // Collapse the sheet only when dragged very far down
            setListSheetExpanded(false);
            setListSheetFullscreen(false);
            Animated.timing(listSheetAnimation, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          } else if (currentPosition < 1.5) {
            // Go to middle state (expanded but not fullscreen)
            setListSheetExpanded(true);
            setListSheetFullscreen(false);
            Animated.timing(listSheetAnimation, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          } else {
            // From fullscreen to expanded
            setListSheetFullscreen(false);
            setListSheetExpanded(true);
            Animated.timing(listSheetAnimation, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        } else {
          // Dragging up
          if (
            currentPosition > 1.5 ||
            (isMovingFast && currentPosition > 0.5)
          ) {
            // Go to fullscreen
            setListSheetExpanded(true);
            setListSheetFullscreen(true);
            Animated.timing(listSheetAnimation, {
              toValue: 2,
              duration: 200,
              useNativeDriver: true,
            }).start();
          } else if (currentPosition > 0.1 || isMovingFast) {
            // Go to middle state
            setListSheetExpanded(true);
            setListSheetFullscreen(false);
            Animated.timing(listSheetAnimation, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }).start();
          } else {
            // Stay collapsed
            setListSheetExpanded(false);
            setListSheetFullscreen(false);
            Animated.timing(listSheetAnimation, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        }
      },
    });
  }, [height, listSheetExpanded, listSheetFullscreen, listSheetAnimation]);

  const handleBarStyles = {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0286FF",
    opacity: 0.8,
  };

  // Update renderListSheet function to fix the native driver height animation issue
  const renderListSheet = useCallback(() => {
    const zIndex = listSheetExpanded ? 1300 : 900;

    // Opacity for the gradient that appears at the bottom in collapsed mode
    const opacityGradient = listSheetAnimation.interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.8, 0.4, 0],
    });

    // Calculate max height based on screen height
    const maxHeight = height;
    const midHeight = height * 0.85;
    const minHeight = height * 0.8;

    return (
      <Animated.View
        style={[
          styles.listSheet,
          {
            transform: [
              {
                translateY: listSheetAnimation.interpolate({
                  inputRange: [0, 1, 2],
                  outputRange: [height * 0.8, height * 0.15, 0], // Fullscreen at position 2
                  extrapolate: "clamp",
                }),
              },
            ],
            // Instead of animating height directly with native driver, set it statically based on the current state
            height: listSheetFullscreen
              ? maxHeight
              : listSheetExpanded
                ? midHeight
                : minHeight,
            maxHeight: maxHeight,
            zIndex,
          },
        ]}
        {...(panResponderRef.current
          ? panResponderRef.current.panHandlers
          : {})}
      >
        <Animated.View
          style={[
            styles.listSheetPreviewGradient,
            { opacity: opacityGradient },
          ]}
        >
          <LinearGradient
            colors={["transparent", "rgba(255,255,255,0.9)"]}
            style={{ width: "100%", height: "100%" }}
          />
        </Animated.View>

        <View style={styles.listSheetHandle}>
          <View style={[styles.listSheetHandleBar, handleBarStyles]} />
        </View>

        <View style={styles.listSheetHeader}>
          <Text className="text-lg font-pbold">Tìm kiếm dịch vụ</Text>
          <View style={styles.searchContainer}>
            <View style={styles.searchInputContainer}>
              <Ionicons name="search" size={20} color="gray" />
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm kiếm dịch vụ"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText.trim().length > 0 && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Ionicons name="close-circle" size={20} color="gray" />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity
              style={[
                styles.filterButton,
                hasActiveFilters && styles.filterButtonActive,
              ]}
              onPress={() => setShowFilterModal(true)}
            >
              <Ionicons
                name="options"
                size={20}
                color={hasActiveFilters ? "#fff" : "#333"}
              />
            </TouchableOpacity>
          </View>

          <View>
            <Text style={styles.listSheetTitle}>
              {services.length
                ? `Đã tìm thấy ${services.length} kết quả`
                : "Không tìm thấy dịch vụ nào"}
            </Text>

            {/* Display active filters */}
            {hasActiveFilters && (
              <View style={styles.activeFiltersContainer}>
                {filters.categories.length > 0 && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {filters.categories.length} thể loại
                    </Text>
                  </View>
                )}

                {filters.ratings.length > 0 && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {filters.ratings.join(", ")}⭐
                    </Text>
                  </View>
                )}

                {(filters.priceRange.min > 0 ||
                  filters.priceRange.max < 10000000) && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      Giá từ: {formatToVND(filters.priceRange.min)} -{" "}
                      {formatToVND(filters.priceRange.max)}
                    </Text>
                  </View>
                )}

                {filters.sortBy && (
                  <View style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {filters.sortBy === "price_asc"
                        ? "Giá tăng dần"
                        : filters.sortBy === "price_desc"
                          ? "Giá giảm dần"
                          : filters.sortBy === "rating"
                            ? "Đánh giá cao nhất"
                            : "Mới nhất"}
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.clearAllFiltersButton}
                  onPress={() => {
                    setFilters(defaultFilters);
                    setPriceRangeMin("0");
                    setPriceRangeMax("10000000");
                  }}
                >
                  <Text style={styles.clearAllFiltersText}>Xóa tất cả</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        <FlatList
          data={services}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContainer,
            {
              paddingBottom: listSheetFullscreen
                ? Platform.OS === "ios"
                  ? 100
                  : 80
                : listSheetExpanded
                  ? 150
                  : 100,
            },
          ]}
          showsVerticalScrollIndicator={true}
        />
      </Animated.View>
    );
  }, [
    services,
    listSheetAnimation,
    listSheetExpanded,
    listSheetFullscreen,
    height,
    renderItem,
    searchText,
    hasActiveFilters,
    filters,
  ]);

  const viewModeButtonActiveStyle = {
    backgroundColor: "#0066CC",
  };

  const renderViewToggle = useCallback(() => {
    return (
      <TouchableOpacity
        style={[
          styles.viewModeButton,
          listSheetExpanded && viewModeButtonActiveStyle,
        ]}
        onPress={toggleListSheet}
      >
        <Ionicons name="list" size={22} color="#fff" />
      </TouchableOpacity>
    );
  }, [listSheetExpanded, toggleListSheet]);

  // Filter Modal Component
  const FilterModal = React.memo(() => {
    // Use a ref to track if initialization has happened
    const isInitialized = useRef(false);

    useEffect(() => {
      // Only initialize when modal opens and hasn't been initialized yet
      if (showFilterModal && !isInitialized.current) {
        setLocalFilters({ ...filters });
        setPriceRangeMin(filters.priceRange.min.toString());
        setPriceRangeMax(filters.priceRange.max.toString());
        isInitialized.current = true;
      }

      // Reset the initialization flag when modal closes
      if (!showFilterModal) {
        isInitialized.current = false;
      }
    }, [showFilterModal]);

    return (
      <Modal
        animationType="slide"
        transparent={true}
        visible={showFilterModal}
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.filterModalContainer}>
          <View style={styles.filterModalContent}>
            <View style={styles.filterModalHeader}>
              <Text style={styles.filterModalTitle}>Bộ lọc tìm kiếm</Text>
              <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterModalBody}>
              {/* Categories Section */}
              {categories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>
                    Thể loại dịch vụ
                  </Text>
                  <View style={styles.filterChipContainer}>
                    {categories.map((category) => (
                      <TouchableOpacity
                        key={`category-${category.id}`}
                        style={[
                          styles.filterChip,
                          localFilters.categories.includes(category.id) &&
                            styles.filterChipSelected,
                        ]}
                        onPress={() => toggleCategory(category.id)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            localFilters.categories.includes(category.id) &&
                              styles.filterChipTextSelected,
                          ]}
                        >
                          {category.category_name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Ratings Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Đánh giá</Text>
                <View style={styles.filterChipContainer}>
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <TouchableOpacity
                      key={`rating-${rating}`}
                      style={[
                        styles.filterChip,
                        localFilters.ratings.includes(rating) &&
                          styles.filterChipSelected,
                      ]}
                      onPress={() => toggleRating(rating)}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          localFilters.ratings.includes(rating) &&
                            styles.filterChipTextSelected,
                        ]}
                      >
                        {rating} ⭐
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Price Range Section */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Khoảng giá</Text>
                <View style={styles.priceInputContainer}>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.priceInputLabel}>Từ</Text>
                    <TextInput
                      style={styles.priceInput}
                      keyboardType="numeric"
                      value={priceRangeMin}
                      onChangeText={setPriceRangeMin}
                      placeholder="0"
                    />
                  </View>
                  <Text style={styles.priceInputSeparator}>-</Text>
                  <View style={styles.priceInputWrapper}>
                    <Text style={styles.priceInputLabel}>Đến</Text>
                    <TextInput
                      style={styles.priceInput}
                      keyboardType="numeric"
                      value={priceRangeMax}
                      onChangeText={setPriceRangeMax}
                      placeholder="10000000"
                    />
                  </View>
                </View>
              </View>

              {/* Sort Options */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Sắp xếp theo</Text>
                <View style={styles.sortOptionsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      localFilters.sortBy === "price_asc" &&
                        styles.sortOptionSelected,
                    ]}
                    onPress={() => setSortOption("price_asc")}
                  >
                    <Ionicons
                      name="arrow-up"
                      size={16}
                      color={
                        localFilters.sortBy === "price_asc" ? "#fff" : "#666"
                      }
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        localFilters.sortBy === "price_asc" &&
                          styles.sortOptionTextSelected,
                      ]}
                    >
                      Giá thấp đến cao
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      localFilters.sortBy === "price_desc" &&
                        styles.sortOptionSelected,
                    ]}
                    onPress={() => setSortOption("price_desc")}
                  >
                    <Ionicons
                      name="arrow-down"
                      size={16}
                      color={
                        localFilters.sortBy === "price_desc" ? "#fff" : "#666"
                      }
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        localFilters.sortBy === "price_desc" &&
                          styles.sortOptionTextSelected,
                      ]}
                    >
                      Giá cao đến thấp
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      localFilters.sortBy === "rating" &&
                        styles.sortOptionSelected,
                    ]}
                    onPress={() => setSortOption("rating")}
                  >
                    <Ionicons
                      name="star"
                      size={16}
                      color={localFilters.sortBy === "rating" ? "#fff" : "#666"}
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        localFilters.sortBy === "rating" &&
                          styles.sortOptionTextSelected,
                      ]}
                    >
                      Đánh giá cao nhất
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.sortOption,
                      localFilters.sortBy === "newest" &&
                        styles.sortOptionSelected,
                    ]}
                    onPress={() => setSortOption("newest")}
                  >
                    <Ionicons
                      name="time"
                      size={16}
                      color={localFilters.sortBy === "newest" ? "#fff" : "#666"}
                    />
                    <Text
                      style={[
                        styles.sortOptionText,
                        localFilters.sortBy === "newest" &&
                          styles.sortOptionTextSelected,
                      ]}
                    >
                      Mới nhất
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            <View style={styles.filterModalFooter}>
              <TouchableOpacity
                style={styles.clearFilterButton}
                onPress={clearAllFilters}
              >
                <Text style={styles.clearFilterButtonText}>Xóa bộ lọc</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyFilterButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyFilterButtonText}>Áp dụng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  });

  // Extract filter component to a separate component with its own state
  const FilterModalContent = React.memo(
    ({
      isVisible,
      onClose,
      onApply,
      onClear,
      initialFilters,
      initialPriceMin,
      initialPriceMax,
      categoriesList,
    }: {
      isVisible: boolean;
      onClose: () => void;
      onApply: (filters: FilterType, min: string, max: string) => void;
      onClear: () => void;
      initialFilters: FilterType;
      initialPriceMin: string;
      initialPriceMax: string;
      categoriesList: CategoryType[];
    }) => {
      // Local state isolated to this component
      const [internalFilters, setInternalFilters] =
        useState<FilterType>(initialFilters);
      const [internalPriceMin, setInternalPriceMin] = useState(initialPriceMin);
      const [internalPriceMax, setInternalPriceMax] = useState(initialPriceMax);

      // Initialize the state only once when modal appears
      useEffect(() => {
        if (isVisible) {
          setInternalFilters(initialFilters);
          setInternalPriceMin(initialPriceMin);
          setInternalPriceMax(initialPriceMax);
        }
      }, [isVisible]);

      // Toggle category internally
      const handleToggleCategory = (categoryId: number) => {
        setInternalFilters((prev) => {
          const newCategories = prev.categories.includes(categoryId)
            ? prev.categories.filter((id) => id !== categoryId)
            : [...prev.categories, categoryId];
          return { ...prev, categories: newCategories };
        });
      };

      // Toggle rating internally
      const handleToggleRating = (rating: number) => {
        setInternalFilters((prev) => {
          const newRatings = prev.ratings.includes(rating)
            ? prev.ratings.filter((r) => r !== rating)
            : [...prev.ratings, rating];
          return { ...prev, ratings: newRatings };
        });
      };

      // Set sort option internally
      const handleSetSortOption = (option: SortOption) => {
        setInternalFilters((prev) => ({
          ...prev,
          sortBy: prev.sortBy === option ? null : option,
        }));
      };

      // Clear filters internally
      const handleClearFilters = () => {
        setInternalFilters({ ...defaultFilters });
        setInternalPriceMin("0");
        setInternalPriceMax("10000000");
        onClear();
      };

      // Apply filters
      const handleApplyFilters = () => {
        onApply(internalFilters, internalPriceMin, internalPriceMax);
      };

      return (
        <Modal
          animationType="slide"
          transparent={true}
          visible={isVisible}
          onRequestClose={onClose}
        >
          <View style={styles.filterModalContainer}>
            <View style={styles.filterModalContent}>
              <View style={styles.filterModalHeader}>
                <Text style={styles.filterModalTitle}>Bộ lọc tìm kiếm</Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.filterModalBody}>
                {/* Categories Section */}
                {categoriesList.length > 0 && (
                  <View style={styles.filterSection}>
                    <Text style={styles.filterSectionTitle}>
                      Thể loại dịch vụ
                    </Text>
                    <View style={styles.filterChipContainer}>
                      {categoriesList.map((category) => (
                        <TouchableOpacity
                          key={`category-${category.id}`}
                          style={[
                            styles.filterChip,
                            internalFilters.categories.includes(category.id) &&
                              styles.filterChipSelected,
                          ]}
                          onPress={() => handleToggleCategory(category.id)}
                        >
                          <Text
                            style={[
                              styles.filterChipText,
                              internalFilters.categories.includes(
                                category.id
                              ) && styles.filterChipTextSelected,
                            ]}
                          >
                            {category.category_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Ratings Section */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Đánh giá</Text>
                  <View style={styles.filterChipContainer}>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <TouchableOpacity
                        key={`rating-${rating}`}
                        style={[
                          styles.filterChip,
                          internalFilters.ratings.includes(rating) &&
                            styles.filterChipSelected,
                        ]}
                        onPress={() => handleToggleRating(rating)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            internalFilters.ratings.includes(rating) &&
                              styles.filterChipTextSelected,
                          ]}
                        >
                          {rating} ⭐
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Price Range Section */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Khoảng giá</Text>
                  <View style={styles.priceInputContainer}>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.priceInputLabel}>Từ</Text>
                      <TextInput
                        style={styles.priceInput}
                        keyboardType="numeric"
                        value={internalPriceMin}
                        onChangeText={setInternalPriceMin}
                        placeholder="0"
                      />
                    </View>
                    <Text style={styles.priceInputSeparator}>-</Text>
                    <View style={styles.priceInputWrapper}>
                      <Text style={styles.priceInputLabel}>Đến</Text>
                      <TextInput
                        style={styles.priceInput}
                        keyboardType="numeric"
                        value={internalPriceMax}
                        onChangeText={setInternalPriceMax}
                        placeholder="10000000"
                      />
                    </View>
                  </View>
                </View>

                {/* Sort Options */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Sắp xếp theo</Text>
                  <View style={styles.sortOptionsContainer}>
                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        internalFilters.sortBy === "price_asc" &&
                          styles.sortOptionSelected,
                      ]}
                      onPress={() => handleSetSortOption("price_asc")}
                    >
                      <Ionicons
                        name="arrow-up"
                        size={16}
                        color={
                          internalFilters.sortBy === "price_asc"
                            ? "#fff"
                            : "#666"
                        }
                      />
                      <Text
                        style={[
                          styles.sortOptionText,
                          internalFilters.sortBy === "price_asc" &&
                            styles.sortOptionTextSelected,
                        ]}
                      >
                        Giá thấp đến cao
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        internalFilters.sortBy === "price_desc" &&
                          styles.sortOptionSelected,
                      ]}
                      onPress={() => handleSetSortOption("price_desc")}
                    >
                      <Ionicons
                        name="arrow-down"
                        size={16}
                        color={
                          internalFilters.sortBy === "price_desc"
                            ? "#fff"
                            : "#666"
                        }
                      />
                      <Text
                        style={[
                          styles.sortOptionText,
                          internalFilters.sortBy === "price_desc" &&
                            styles.sortOptionTextSelected,
                        ]}
                      >
                        Giá cao đến thấp
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        internalFilters.sortBy === "rating" &&
                          styles.sortOptionSelected,
                      ]}
                      onPress={() => handleSetSortOption("rating")}
                    >
                      <Ionicons
                        name="star"
                        size={16}
                        color={
                          internalFilters.sortBy === "rating" ? "#fff" : "#666"
                        }
                      />
                      <Text
                        style={[
                          styles.sortOptionText,
                          internalFilters.sortBy === "rating" &&
                            styles.sortOptionTextSelected,
                        ]}
                      >
                        Đánh giá cao nhất
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.sortOption,
                        internalFilters.sortBy === "newest" &&
                          styles.sortOptionSelected,
                      ]}
                      onPress={() => handleSetSortOption("newest")}
                    >
                      <Ionicons
                        name="time"
                        size={16}
                        color={
                          internalFilters.sortBy === "newest" ? "#fff" : "#666"
                        }
                      />
                      <Text
                        style={[
                          styles.sortOptionText,
                          internalFilters.sortBy === "newest" &&
                            styles.sortOptionTextSelected,
                        ]}
                      >
                        Mới nhất
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.filterModalFooter}>
                <TouchableOpacity
                  style={styles.clearFilterButton}
                  onPress={handleClearFilters}
                >
                  <Text style={styles.clearFilterButtonText}>Xóa bộ lọc</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyFilterButton}
                  onPress={handleApplyFilters}
                >
                  <Text style={styles.applyFilterButtonText}>Áp dụng</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      );
    }
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Link href="/home" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Ionicons name="chevron-back" size={24} color="#000" />
            </TouchableOpacity>
          </Link>
          <Text style={styles.title}>Tìm quanh đây</Text>
        </View>
        {renderViewToggle()}
      </View>

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
                : [106.660172, 10.762622]
            }
            animationMode="flyTo"
            animationDuration={1000}
          />

          {location.latitude && location.longitude && (
            <MapboxGL.UserLocation visible={true} />
          )}

          {renderMarkers()}

          {renderRadiusCircle()}
        </MapboxGL.MapView>

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

        {renderMapControls()}

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
                top: height * 0.15,
                left: width * 0.05,
                right: width * 0.05,
                maxHeight: height * 0.7,
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
              <ServiceCard data={selectedService} />
              <View style={styles.viewDetailButton}>
                <Text style={styles.viewDetailText}>Xem chi tiết</Text>
                <Ionicons name="arrow-forward" size={16} color="#0286FF" />
              </View>
            </TouchableOpacity>
          </Animated.View>
        )}

        {renderListSheet()}
      </View>

      <Animated.View
        style={[
          styles.bottomRadiusContainer,
          {
            opacity: 1,
            zIndex: 800,
            transform: [
              {
                translateY: 0,
              },
            ],
          },
        ]}
        pointerEvents="auto"
      >
        <View style={styles.radiusHeader}>
          <Text style={styles.radiusLabel}>
            Bán kính: <Text style={styles.radiusValue}>{displayRadius} km</Text>
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
      </Animated.View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0286FF" />
            <Text style={styles.loadingText}>Đang tìm kiếm dịch vụ...</Text>
          </View>
        </View>
      )}

      {/* Filter Modal */}
      <FilterModalContent
        isVisible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={(newFilters, min, max) => {
          const newMinPrice = parseInt(min) || 0;
          const newMaxPrice = parseInt(max) || 10000000;

          setFilters({
            ...newFilters,
            priceRange: {
              min: newMinPrice,
              max: newMaxPrice,
            },
          });
          setShowFilterModal(false);
        }}
        onClear={clearAllFilters}
        initialFilters={filters}
        initialPriceMin={priceRangeMin}
        initialPriceMax={priceRangeMax}
        categoriesList={categories}
      />
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
    bottom: 210,
    right: 15,
    gap: 10,
    zIndex: 1200,
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
    gap: 15,
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
    bottom: 10,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    marginHorizontal: 10,
    zIndex: 800,
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
    zIndex: 10,
  },
  centeredCard: {
    zIndex: 11,
    borderRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  listSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: height * 0.8,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 12,
    zIndex: 900,
  },
  listSheetHandle: {
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 8,
  },
  listSheetHandleBar: {
    width: 60,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#0286FF",
    opacity: 0.8,
  },
  listSheetHeader: {
    gap: 15,
    paddingVertical: 15,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
    marginBottom: 5,
    backgroundColor: "white",
  },
  listSheetTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  listSheetPreviewGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "35%",
    zIndex: 5,
    pointerEvents: "none",
  },
  filterModalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  filterModalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f2f2f2",
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  filterModalBody: {
    maxHeight: "70%",
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  filterChipContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    marginBottom: 6,
  },
  filterChipSelected: {
    backgroundColor: "#0286FF",
    borderColor: "#0286FF",
  },
  filterChipText: {
    fontSize: 14,
    color: "#333",
  },
  filterChipTextSelected: {
    color: "#fff",
  },
  priceInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  priceInputWrapper: {
    flexDirection: "column",
    alignItems: "flex-start",
    flex: 1,
  },
  priceInputLabel: {
    fontSize: 14,
    marginBottom: 5,
    color: "#666",
  },
  priceInput: {
    width: "95%",
    padding: 10,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#f9f9f9",
  },
  priceInputSeparator: {
    fontSize: 18,
    fontWeight: "bold",
    marginHorizontal: 10,
    color: "#666",
  },
  sortOptionsContainer: {
    flexDirection: "column",
    gap: 10,
  },
  sortOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  sortOptionSelected: {
    backgroundColor: "#0286FF",
    borderColor: "#0286FF",
  },
  sortOptionText: {
    fontSize: 14,
    color: "#333",
    marginLeft: 8,
  },
  sortOptionTextSelected: {
    color: "#fff",
  },
  filterModalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#f2f2f2",
    paddingTop: 15,
    marginTop: 10,
  },
  clearFilterButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "#f2f2f2",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  clearFilterButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
  },
  applyFilterButton: {
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 8,
    backgroundColor: "#0286FF",
  },
  applyFilterButtonText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flex: 1,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 15,
  },
  filterButton: {
    backgroundColor: "#f5f5f5",
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    justifyContent: "center",
    alignItems: "center",
  },
  filterButtonActive: {
    backgroundColor: "#0286FF",
    borderColor: "#0286FF",
  },
  activeFiltersContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    paddingBottom: 5,
  },
  activeFilterChip: {
    backgroundColor: "rgba(2, 134, 255, 0.15)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  activeFilterText: {
    color: "#0286FF",
    fontSize: 12,
    fontWeight: "500",
  },
  clearAllFiltersButton: {
    backgroundColor: "rgba(255, 59, 48, 0.15)",
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  clearAllFiltersText: {
    color: "#FF3B30",
    fontSize: 12,
    fontWeight: "500",
  },
  expandToFullscreenButton: {
    position: "absolute",
    top: 12,
    right: 15,
    backgroundColor: "rgba(2, 134, 255, 0.1)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  fullscreenBackButton: {
    position: "absolute",
    right: 15,
    backgroundColor: "rgba(2, 134, 255, 0.1)",
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});

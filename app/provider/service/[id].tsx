import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";

import { useLocalSearchParams, router, useNavigation } from "expo-router";
import { Ionicons, FontAwesome, Entypo, Octicons } from "@expo/vector-icons";
import useProviderStore from "@/stores/providerStore";
import { ServiceType, PriceType, CommentType, BenefitType } from "@/types/type";
import {
  getImageSource,
  formatToVND,
  getServiceImageSource,
} from "@/utils/utils";
import CustomButton from "@/components/CustomButton";
import InputField from "@/components/InputField";
import LocationInputField from "@/components/LocationInputField";
import * as ImagePicker from "expo-image-picker";
import useRentoStore from "@/stores/dataStore";
import CommentCard from "@/components/CommentCard";
import { axiosFetch } from "@/stores/dataStore";
import RatingStar from "@/components/RatingStar";
import Swiper from "react-native-swiper";
import CustomModal from "@/app/components/CustomModal";
import { PaginationType } from "@/types/pagination";
import { comment_data } from "@/lib/dummy";

type ValidationRule = {
  isValid: boolean;
  message: string;
}[];

const rules: Record<string, ValidationRule> = {
  service_name: [
    {
      isValid: true,
      message: "Tên dịch vụ không được để trống",
    },
    {
      isValid: true,
      message: "Tên dịch vụ phải có ít nhất 5 ký tự",
    },
  ],
  service_description: [
    {
      isValid: true,
      message: "Mô tả dịch vụ không được để trống",
    },
    {
      isValid: true,
      message: "Mô tả dịch vụ phải có ít nhất 20 ký tự",
    },
  ],
  location_name: [
    {
      isValid: true,
      message: "Địa chỉ không được để trống",
    },
  ],
};

const ProviderServiceDetail = () => {
  const { id } = useLocalSearchParams();
  const [service, setService] = useState<ServiceType | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showAddPriceModal, setShowAddPriceModal] = useState(false);
  const [showEditPriceModal, setShowEditPriceModal] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<PriceType | null>(null);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [serviceComments, setServiceComments] = useState<CommentType[]>([]);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [showAddBenefitModal, setShowAddBenefitModal] = useState(false);
  const [showEditBenefitModal, setShowEditBenefitModal] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState<BenefitType | null>(
    null
  );
  const navigation = useNavigation();
  const [benefitForm, setBenefitForm] = useState<{
    benefit_name: string;
    price_id: number[];
  }>({
    benefit_name: "",
    price_id: [],
  });
  const [selectedBenefitsForPrice, setSelectedBenefitsForPrice] = useState<
    number[]
  >([]);
  const [linkedBenefits, setLinkedBenefits] = useState<number[]>([]);
  const [benefitsToDetach, setBenefitsToDetach] = useState<number[]>([]);
  const [independentBenefits, setIndependentBenefits] = useState<BenefitType[]>(
    []
  );
  const {
    fetchServiceById,
    updateService,
    deleteService,
    deleteServicePrice,
    addServiceBenefit,
    updateServiceBenefit,
    deleteServiceBenefit,
    getIndependentBenefits,
    bulkUpdateBenefits,
    addServicePriceWithBenefits,
    updateServicePriceWithBenefits,
    bulkUpdatePrices,
  } = useProviderStore();
  const categories = useRentoStore((state) => state.categories);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isValid, setIsValid] = useState(false);

  const [formData, setFormData] = useState({
    service_name: "",
    service_description: "",
    location_name: "",
    lat: null as number | null,
    lng: null as number | null,
    real_location_name: "",
    province_id: null as number | null,
  });

  const [priceForm, setPriceForm] = useState({
    price_name: "",
    price_value: "",
  });

  const [priceErrors, setPriceErrors] = useState({
    price_name: "",
    price_value: "",
  });

  const [benefitErrors, setBenefitErrors] = useState({
    benefit_name: "",
  });

  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const [modal, setModal] = useState({
    visible: false,
    title: "",
    message: "",
    type: "info" as "success" | "error" | "confirm" | "info",
    onConfirm: () => {},
  });

  const [isPriceFormValid, setIsPriceFormValid] = useState(false);
  const [isBenefitFormValid, setIsBenefitFormValid] = useState(false);

  useEffect(() => {
    rules.service_name[0].isValid = formData.service_name.trim() !== "";
    rules.service_name[1].isValid = formData.service_name.trim().length >= 5;

    rules.service_description[0].isValid =
      formData.service_description.trim() !== "";
    rules.service_description[1].isValid =
      formData.service_description.trim().length >= 20;

    rules.location_name[0].isValid = formData.location_name.trim() !== "";

    let isFormValid = true;
    for (const field in rules) {
      const fieldRules = rules[field];
      for (const rule of fieldRules) {
        if (!rule.isValid) {
          isFormValid = false;
          break;
        }
      }
    }

    isFormValid = isFormValid && selectedCategory !== null;

    setIsValid(isFormValid);
  }, [formData, selectedCategory]);

  const fetchData = async () => {
    if (!id) return;

    try {
      const data = await fetchServiceById(Number(id));
      if (data) {
        if ((data as any).image && (!data.images || data.images.length === 0)) {
          data.images = (data as any).image.map((img: any) => ({
            id: img.id,
            image_url: img.path || "",
          }));
        }

        if (data.price) {
          data.price = data.price.sort((a, b) => {
            if (!a.created_at || !b.created_at) return 0;
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          });
        }

        if (data.benefit) {
          data.benefit = data.benefit.sort((a, b) => {
            if (!a.created_at || !b.created_at) return 0;
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          });
        }

        setService(data);
        setFormData({
          service_name: data.service_name || "",
          service_description: data.service_description || "",
          location_name: data.location?.location_name || "",
          lat: data.location?.lat || null,
          lng: data.location?.lng || null,
          real_location_name: data.location?.real_location_name || "",
          province_id: data.location?.province_id || null,
        });
        setSelectedCategory(data.category?.id || null);

        setImageFiles([]);

        if (data.images && data.images.length > 0) {
          const imageUrls = data.images.map((img) => {
            const imageUrl = img.image_url || "";
            const source = getServiceImageSource(imageUrl);
            return typeof source === "string" ? source : source.uri;
          });
          setImages(imageUrls);
        } else {
          setImages([]);
        }

        if (!data.benefit || data.benefit.length === 0) {
          try {
            const benefitResponse = await axiosFetch(`/benefits/service/${id}`);
            if (benefitResponse?.data) {
              data.benefit = benefitResponse.data;
              setService({ ...data });
            }
          } catch (benefitError) {
            console.error("Lỗi khi tải benefits:", benefitError);
          }
        }

        try {
          const independentBenefitsResponse = await getIndependentBenefits(
            Number(id)
          );
          if (
            independentBenefitsResponse &&
            typeof independentBenefitsResponse === "object" &&
            "data" in independentBenefitsResponse
          ) {
            setIndependentBenefits(independentBenefitsResponse.data || []);
          }
        } catch (error) {
          console.error("Lỗi khi lấy benefits độc lập:", error);
        }
      }
    } catch (error: any) {
      console.error("Lỗi khi tải dịch vụ:", error?.response?.data || error);
      Alert.alert(
        "Lỗi",
        "Không thể tải thông tin dịch vụ. Vui lòng thử lại sau."
      );
    }
  };

  useEffect(() => {
    fetchData();
    navigation.setOptions({
      headerRight: () => (
        <View className="flex-row">
          <TouchableOpacity
            onPressIn={() => setShowEditModal(true)}
            className="mr-4"
          >
            <Ionicons name="create-outline" size={24} color="black" />
          </TouchableOpacity>
          <TouchableOpacity onPressIn={() => setShowDeleteConfirm(true)}>
            <Ionicons name="trash-outline" size={24} color="red" />
          </TouchableOpacity>
        </View>
      ),
    });
  }, [id]);

  const onRefresh = async () => {
    setIsRefreshing(true);
    await fetchData();
    fetchComments();
    setIsRefreshing(false);
  };

  const handleLocationSelected = (data: {
    lat: number;
    lng: number;
    address: string;
    formattedAddress?: string;
    province_id?: number | null;
  }) => {
    setFormData((prev) => ({
      ...prev,
      lat: data.lat,
      lng: data.lng,
      location_name: data.address,
      real_location_name: data.formattedAddress || data.address,
      province_id: data.province_id || null,
    }));
  };

  const handleUpdateService = async () => {
    let errorMessages = [];

    if (!formData.service_name.trim()) {
      errorMessages.push("Tên dịch vụ không được để trống");
    } else if (formData.service_name.trim().length < 5) {
      errorMessages.push("Tên dịch vụ phải có ít nhất 5 ký tự");
    }

    if (!formData.service_description.trim()) {
      errorMessages.push("Mô tả dịch vụ không được để trống");
    } else if (formData.service_description.trim().length < 20) {
      errorMessages.push("Mô tả dịch vụ phải có ít nhất 20 ký tự");
    }

    if (!formData.location_name.trim()) {
      errorMessages.push("Địa chỉ không được để trống");
    }

    if (!selectedCategory) {
      errorMessages.push("Vui lòng chọn danh mục dịch vụ");
    }

    if (errorMessages.length > 0) {
      Alert.alert("Lỗi", errorMessages.join("\n"));
      return;
    }

    if (!service) {
      Alert.alert("Lỗi", "Không tìm thấy thông tin dịch vụ");
      return;
    }

    try {
      setIsUploading(true);

      const formDataToSend = new FormData();
      formDataToSend.append("service_name", formData.service_name.trim());
      formDataToSend.append(
        "service_description",
        formData.service_description.trim()
      );
      formDataToSend.append("location_name", formData.location_name.trim());
      formDataToSend.append("category_id", selectedCategory!.toString());

      if (formData.lat !== null) {
        formDataToSend.append("lat", String(formData.lat));
      }

      if (formData.lng !== null) {
        formDataToSend.append("lng", String(formData.lng));
      }

      if (formData.real_location_name) {
        formDataToSend.append(
          "real_location_name",
          formData.real_location_name
        );
      }

      if (formData.province_id) {
        formDataToSend.append("province_id", String(formData.province_id));
      }

      formDataToSend.append("_method", "PUT");

      if (imageFiles.length > 0) {
        imageFiles.forEach((file, index) => {
          formDataToSend.append(`images[]`, file);
        });
      }

      if (service.images && service.images.length > 0) {
        const keptImageIds = [];

        if (images.length < service.images.length) {
          for (let i = 0; i < service.images.length; i++) {
            const originalImg = service.images[i];
            const originalImgUrl = getServiceImageSource(originalImg.image_url);
            const imgUri =
              typeof originalImgUrl === "string"
                ? originalImgUrl
                : originalImgUrl.uri;

            let isImageKept = false;
            for (let j = 0; j < images.length; j++) {
              if (images[j] === imgUri) {
                isImageKept = true;
                break;
              }
            }

            if (isImageKept) {
              keptImageIds.push(originalImg.id);
            } else {
            }
          }
        } else {
          for (let i = 0; i < service.images.length; i++) {
            keptImageIds.push(service.images[i].id);
          }
        }

        if (keptImageIds.length > 0) {
          keptImageIds.forEach((id) => {
            formDataToSend.append(`kept_image_ids[]`, id.toString());
          });
        } else if (service.images.length > 0 && keptImageIds.length === 0) {
          formDataToSend.append("remove_all_images", "1");
        }
      }

      await updateService(service.id, formDataToSend);

      setShowEditModal(false);
      setIsUploading(false);
      Alert.alert("Thành công", "Cập nhật thông tin dịch vụ thành công");

      fetchData();
    } catch (error: any) {
      setIsUploading(false);
      console.error(
        "Lỗi khi cập nhật dịch vụ:",
        error?.response?.data || error
      );

      let errorMessage = "Không thể cập nhật dịch vụ. Vui lòng thử lại sau.";

      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorDetails = Object.keys(errors)
          .map((key) => `${key}: ${errors[key].join(", ")}`)
          .join("\n");

        errorMessage = `Lỗi dữ liệu:\n${errorDetails}`;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Lỗi", errorMessage);
    }
  };

  const handleDeleteService = async () => {
    if (!service) return;

    showModal(
      "Xác nhận xóa dịch vụ",
      "Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể hoàn tác.",
      "confirm",
      async () => {
        try {
          await deleteService(Number(id));
          router.replace("/provider/services");
          showModal("Thành công", "Dịch vụ đã được xóa thành công", "success");
        } catch (error: any) {
          console.error("Lỗi khi xóa dịch vụ:", error?.response?.data || error);
          showModal(
            "Lỗi",
            "Không thể xóa dịch vụ. Vui lòng thử lại sau.",
            "error"
          );
        }
      }
    );
  };

  const validatePriceForm = () => {
    let isValid = true;
    const errors = {
      price_name: "",
      price_value: "",
    };

    if (!priceForm.price_name.trim()) {
      errors.price_name = "Tên gói dịch vụ không được để trống";
      isValid = false;
    } else if (priceForm.price_name.trim().length < 3) {
      errors.price_name = "Tên gói dịch vụ phải có ít nhất 3 ký tự";
      isValid = false;
    }

    if (!priceForm.price_value.trim()) {
      errors.price_value = "Giá gói dịch vụ không được để trống";
      isValid = false;
    } else {
      const priceValue = parseInt(priceForm.price_value.replace(/\D/g, ""));
      if (isNaN(priceValue) || priceValue <= 0) {
        errors.price_value = "Giá gói dịch vụ phải là số dương";
        isValid = false;
      } else if (priceValue < 1000) {
        errors.price_value = "Giá gói dịch vụ phải lớn hơn hoặc bằng 1.000 VND";
        isValid = false;
      }
    }

    setPriceErrors(errors);
    setIsPriceFormValid(isValid);
    return isValid;
  };

  const validateBenefitForm = () => {
    let isValid = true;
    const errors = {
      benefit_name: "",
    };

    if (!benefitForm.benefit_name.trim()) {
      errors.benefit_name = "Tên lợi ích không được để trống";
      isValid = false;
    } else if (benefitForm.benefit_name.trim().length < 3) {
      errors.benefit_name = "Tên lợi ích phải có ít nhất 3 ký tự";
      isValid = false;
    } else if (benefitForm.benefit_name.trim().length > 50) {
      errors.benefit_name = "Tên lợi ích không được vượt quá 50 ký tự";
      isValid = false;
    }

    setBenefitErrors(errors);
    setIsBenefitFormValid(isValid);
    return isValid;
  };

  const handleAddPrice = async () => {
    if (!service) return;

    if (!validatePriceForm()) {
      return;
    }

    try {
      const priceValue = parseInt(priceForm.price_value.replace(/\D/g, ""));

      await addServicePriceWithBenefits(service.id, {
        price_name: priceForm.price_name,
        price_value: priceValue,
        benefit_ids:
          selectedBenefitsForPrice.length > 0
            ? selectedBenefitsForPrice
            : undefined,
      });

      setShowAddPriceModal(false);
      setPriceForm({ price_name: "", price_value: "" });
      setPriceErrors({ price_name: "", price_value: "" });
      setSelectedBenefitsForPrice([]);
      showModal("Thành công", "Thêm gói dịch vụ thành công", "success");
      fetchData();
    } catch (error: any) {
      console.error(
        "Lỗi khi thêm gói dịch vụ:",
        error?.response?.data || error
      );
      showModal(
        "Lỗi",
        "Không thể thêm gói dịch vụ. Vui lòng thử lại sau.",
        "error"
      );
    }
  };

  const handleUpdatePrice = async () => {
    if (!service || !selectedPrice) return;

    if (!validatePriceForm()) {
      return;
    }

    try {
      const priceValue = parseInt(priceForm.price_value.replace(/\D/g, ""));

      const finalLinkedBenefits = [
        ...linkedBenefits.filter((id) => !benefitsToDetach.includes(id)),
        ...selectedBenefitsForPrice,
      ];

      const uniqueLinkedBenefits = [...new Set(finalLinkedBenefits)];

      await updateServicePriceWithBenefits(selectedPrice.id, {
        price_name: priceForm.price_name,
        price_value: priceValue,
        benefit_ids: uniqueLinkedBenefits,
      });

      setShowEditPriceModal(false);
      setSelectedPrice(null);
      setPriceForm({ price_name: "", price_value: "" });
      setPriceErrors({ price_name: "", price_value: "" });
      setSelectedBenefitsForPrice([]);
      setLinkedBenefits([]);
      setBenefitsToDetach([]);
      showModal("Thành công", "Cập nhật gói dịch vụ thành công", "success");
      fetchData();
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật gói dịch vụ:",
        error?.response?.data || error
      );
      showModal(
        "Lỗi",
        "Không thể cập nhật gói dịch vụ. Vui lòng thử lại sau.",
        "error"
      );
    }
  };

  const handleDeletePrice = async (priceId: number) => {
    if (!service) return;

    showModal(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa gói dịch vụ này không?",
      "confirm",
      async () => {
        try {
          await deleteServicePrice(service.id, priceId);
          showModal("Thành công", "Xóa gói dịch vụ thành công", "success");
          fetchData();
        } catch (error: any) {
          console.error(
            "Lỗi khi xóa gói dịch vụ:",
            error?.response?.data || error
          );
          showModal(
            "Lỗi",
            "Không thể xóa gói dịch vụ. Vui lòng thử lại sau.",
            "error"
          );
        }
      }
    );
  };

  const formatPriceInput = (text: string) => {
    const numericValue = text.replace(/\D/g, "");

    const formattedValue = new Intl.NumberFormat("vi-VN").format(
      parseInt(numericValue || "0")
    );
    return formattedValue;
  };
  const nextCursorComment = useRef<string | null>(null);
  const retryLoadComment = useRef(0);
  const fetchComments = async () => {
    try {
      setIsLoadingComments(true);
      let url = `/provider/comments/${id}`;
      if (nextCursorComment.current) {
        url += `?cursor=${nextCursorComment.current}`;
      }
      const response = await axiosFetch(url, "get");
      const paginateComment: PaginationType<CommentType> = response?.data;
      const commentData = paginateComment?.data || [];
      if (commentData?.length > 0) {
        nextCursorComment.current = paginateComment?.next_cursor || null;
        retryLoadComment.current = 0;
        setServiceComments((prev) => [...prev, ...commentData]);
      } else if (retryLoadComment.current < 10) {
        retryLoadComment.current++;
        await fetchComments();
      }
    } catch (error) {
      if (retryLoadComment.current < 10) {
        retryLoadComment.current++;
        await fetchComments();
      }
      console.error("Lỗi khi tải bình luận:", error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    showModal(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa bình luận này?",
      "confirm",
      async () => {
        try {
          await axiosFetch(`/comments/${commentId}`, "delete");
          showModal("Thành công", "Xóa bình luận thành công", "success");
          setServiceComments((prev) =>
            prev.filter((cmt) => cmt.id !== commentId)
          );
          refreshComment();
        } catch (error: any) {
          console.error(
            "Lỗi khi xóa bình luận:",
            error?.response?.data || error
          );
          showModal(
            "Lỗi",
            "Không thể xóa bình luận. Vui lòng thử lại sau.",
            "error"
          );
        }
      }
    );
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map((asset) => asset.uri);
        setImages([...images, ...newImages]);

        const newImageFiles = result.assets.map((asset) => {
          const fileName =
            asset.uri.split("/").pop() || `image-${Date.now()}.jpg`;
          const fileType = fileName.split(".").pop();

          return {
            uri: asset.uri,
            name: fileName,
            type: `image/${fileType || "jpeg"}`,
          };
        });

        setImageFiles([...imageFiles, ...newImageFiles]);
      }
    } catch (error) {
      console.error("Lỗi khi chọn hình ảnh:", error);
      Alert.alert("Lỗi", "Không thể chọn hình ảnh. Vui lòng thử lại sau.");
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    setImages(newImages);

    if (index >= (service?.images?.length || 0)) {
      const newImageIndex = index - (service?.images?.length || 0);
      const newImageFiles = [...imageFiles];
      newImageFiles.splice(newImageIndex, 1);
      setImageFiles(newImageFiles);
    }
  };

  const benefitExamples = [
    "Bảo hành 12 tháng",
    "Hỗ trợ 24/7",
    "Giao hàng tận nơi",
    "Tư vấn trực tiếp",
    "Hướng dẫn sử dụng",
  ];

  const getRandomBenefitExample = () => {
    const randomIndex = Math.floor(Math.random() * benefitExamples.length);
    return benefitExamples[randomIndex];
  };

  const handleAddBenefit = async () => {
    if (!service) return;

    if (!validateBenefitForm()) {
      return;
    }

    try {
      await addServiceBenefit(service.id, {
        benefit_name: benefitForm.benefit_name,
        price_id: benefitForm.price_id,
      });

      setShowAddBenefitModal(false);
      setBenefitForm({ benefit_name: "", price_id: [] });
      setBenefitErrors({ benefit_name: "" });
      showModal("Thành công", "Thêm lợi ích thành công", "success");
      fetchData();
    } catch (error: any) {
      console.error("Lỗi khi thêm lợi ích:", error?.response?.data || error);
      let errorMessage = "Không thể thêm lợi ích. Vui lòng thử lại sau.";

      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorDetails = Object.keys(errors)
          .map((key) => `${key}: ${errors[key].join(", ")}`)
          .join("\n");

        errorMessage = `Lỗi dữ liệu:\n${errorDetails}`;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showModal("Lỗi", errorMessage, "error");
    }
  };

  const handleUpdateBenefit = async () => {
    if (!service || !selectedBenefit) return;

    if (!validateBenefitForm()) {
      return;
    }

    try {
      await updateServiceBenefit(service.id, selectedBenefit.id, {
        benefit_name: benefitForm.benefit_name,
        price_id: benefitForm.price_id,
      });

      setShowEditBenefitModal(false);
      setSelectedBenefit(null);
      setBenefitForm({ benefit_name: "", price_id: [] });
      setBenefitErrors({ benefit_name: "" });
      showModal("Thành công", "Cập nhật lợi ích thành công", "success");
      fetchData();
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật lợi ích:",
        error?.response?.data || error
      );
      let errorMessage = "Không thể cập nhật lợi ích. Vui lòng thử lại sau.";

      if (error?.response?.data?.errors) {
        const errors = error.response.data.errors;
        const errorDetails = Object.keys(errors)
          .map((key) => `${key}: ${errors[key].join(", ")}`)
          .join("\n");

        errorMessage = `Lỗi dữ liệu:\n${errorDetails}`;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      showModal("Lỗi", errorMessage, "error");
    }
  };

  const handleBulkUpdateBenefits = async (
    benefitsToUpdate: {
      id: number;
      benefit_name: string;
      price_ids: number[];
    }[]
  ) => {
    if (!service) return;

    try {
      await bulkUpdateBenefits(benefitsToUpdate);
      Alert.alert("Thành công", "Cập nhật các lợi ích thành công");
      fetchData();
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật hàng loạt lợi ích:",
        error?.response?.data || error
      );
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật các lợi ích. Vui lòng thử lại sau."
      );
    }
  };

  const handleDeleteBenefit = async (benefitId: number) => {
    if (!service) return;

    showModal(
      "Xác nhận",
      "Bạn có chắc chắn muốn xóa lợi ích này?",
      "confirm",
      async () => {
        try {
          await deleteServiceBenefit(service.id, benefitId);
          showModal("Thành công", "Xóa lợi ích thành công", "success");
          fetchData();
        } catch (error: any) {
          console.error("Lỗi khi xóa lợi ích:", error?.response?.data || error);
          showModal(
            "Lỗi",
            "Không thể xóa lợi ích. Vui lòng thử lại sau.",
            "error"
          );
        }
      }
    );
  };

  const togglePriceSelection = (priceId: number) => {
    setBenefitForm((prev) => {
      const newPriceIds = [...prev.price_id];
      const index = newPriceIds.indexOf(priceId);

      if (index > -1) {
        newPriceIds.splice(index, 1);
      } else {
        newPriceIds.push(priceId);
      }

      return { ...prev, price_id: newPriceIds };
    });
  };

  const toggleBenefitForPrice = (benefitId: number) => {
    setSelectedBenefitsForPrice((prev) => {
      if (prev.includes(benefitId)) {
        return prev.filter((id) => id !== benefitId);
      } else {
        return [...prev, benefitId];
      }
    });
  };

  const toggleLinkedBenefit = (benefitId: number) => {
    if (benefitsToDetach.includes(benefitId)) {
      setBenefitsToDetach((prev) => prev.filter((id) => id !== benefitId));
    } else {
      setBenefitsToDetach((prev) => [...prev, benefitId]);
    }
  };

  const selectAllBenefits = (select: boolean) => {
    if (select) {
      if (service?.benefit) {
        if (showEditPriceModal) {
          const unlinkedBenefits = service.benefit
            .filter((benefit) => !linkedBenefits.includes(benefit.id))
            .map((benefit) => benefit.id);
          setSelectedBenefitsForPrice(unlinkedBenefits);
        } else if (showAddPriceModal) {
          const allBenefitIds = service.benefit.map((benefit) => benefit.id);
          setSelectedBenefitsForPrice(allBenefitIds);
        } else if (showAddBenefitModal || showEditBenefitModal) {
          if (service.price) {
            const allPriceIds = service.price.map((price) => price.id);
            setBenefitForm((prev) => ({
              ...prev,
              price_id: allPriceIds,
            }));
          }
        }
      }
    } else {
      if (showAddBenefitModal || showEditBenefitModal) {
        setBenefitForm((prev) => ({
          ...prev,
          price_id: [],
        }));
      } else {
        setSelectedBenefitsForPrice([]);
      }
    }
  };

  const detachAllBenefits = () => {
    if (service?.benefit && linkedBenefits.length > 0) {
      setBenefitsToDetach(linkedBenefits);
    }
  };

  const restoreAllBenefits = () => {
    setBenefitsToDetach([]);
  };

  service?.images?.map((image) => {});

  const handleBulkUpdatePrices = async (
    pricesToUpdate: {
      id: number;
      price_name: string;
      price_value: number;
      benefit_ids?: number[];
    }[]
  ) => {
    if (!service) return;

    try {
      await bulkUpdatePrices(pricesToUpdate);
      Alert.alert("Thành công", "Cập nhật các gói dịch vụ thành công");
      fetchData();
    } catch (error: any) {
      console.error(
        "Lỗi khi cập nhật hàng loạt gói dịch vụ:",
        error?.response?.data || error
      );
      Alert.alert(
        "Lỗi",
        "Không thể cập nhật các gói dịch vụ. Vui lòng thử lại sau."
      );
    }
  };

  useEffect(() => {
    fetchComments();
  }, [id]);

  const [isRefreshingComment, setIsRefreshingComment] = useState(false);
  const refreshComment = async () => {
    setIsRefreshingComment(true);
    setServiceComments([]);
    nextCursorComment.current = null;
    await fetchComments();
    setIsRefreshingComment(false);
  };

  const [isLoadMoreComment, setIsLoadMoreComment] = useState(false);
  const loadMoreComment = async () => {
    console.log(nextCursorComment.current);
    if (nextCursorComment.current) {
      await fetchComments();
    }
  };

  const showModal = (
    title: string,
    message: string,
    type: "success" | "error" | "confirm" | "info",
    onConfirm?: () => void
  ) => {
    setModal({
      visible: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => {}),
    });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, visible: false }));
  };

  useEffect(() => {
    validatePriceForm();
  }, [priceForm]);

  useEffect(() => {
    validateBenefitForm();
  }, [benefitForm]);

  return (
    <View>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {/* Hình ảnh dịch vụ */}
        {service?.images && service.images.length > 0 ? (
          <Swiper
            className="h-64 w-full"
            renderPagination={(index, total) => (
              <View className="rounded-2xl pt-[3px] w-auto px-3 h-[25px] bg-neutral-900 justify-center items-center absolute bottom-5 right-5">
                <Text
                  className="font-pmedium text-white text-center"
                  numberOfLines={1}
                >
                  {index + 1}/{total}
                </Text>
              </View>
            )}
          >
            {service.images.map((image, index) => (
              <Image
                key={service.id}
                source={getServiceImageSource(image.image_url)}
                className="h-full w-full"
                resizeMode="cover"
                onError={(e) => {
                  console.error(
                    "Lỗi tải ảnh:",
                    image.image_url,
                    e.nativeEvent.error
                  );
                }}
                defaultSource={require("@/assets/images/avatar_placeholder_icon.png")}
              />
            ))}
          </Swiper>
        ) : (
          <View className="bg-white h-64 justify-center items-center">
            <Ionicons name="image-outline" size={64} color="gray" />
            <Text className="text-gray-500 mt-2">Không có hình ảnh</Text>
          </View>
        )}

        {/* Thông tin dịch vụ */}
        <View className="p-5 bg-white mt-2">
          <Text className="font-pbold text-2xl">{service?.service_name}</Text>
          <View className="flex-row items-center mt-2">
            <FontAwesome name="star" size={16} color="#FFD700" />
            <Text className="ml-1 font-pmedium">
              {service?.average_rate?.toFixed(1) || "0.0"}
            </Text>
            <Text className="ml-2 font-pregular text-gray-600">
              ({service?.comment_count || 0} đánh giá)
            </Text>
          </View>
          <View className="flex-row items-center mt-2">
            <Ionicons name="location-outline" size={16} color="gray" />
            <Text className="ml-1 font-pmedium text-gray-600">
              {service?.location?.location_name || "Chưa có địa chỉ"}
            </Text>
          </View>
          <View className="mt-4">
            <Text className="font-pmedium text-lg">Mô tả dịch vụ</Text>
            <Text className="font-pregular mt-2">
              {service?.service_description || "Chưa có mô tả"}
            </Text>
          </View>
        </View>

        {/* Gói dịch vụ */}
        <View className="p-5 bg-white mt-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-pbold text-xl">Gói dịch vụ</Text>
            <TouchableOpacity
              onPress={() => {
                setPriceForm({ price_name: "", price_value: "" });
                setShowAddPriceModal(true);
              }}
              className="bg-primary-500 px-3 py-1 rounded-full"
            >
              <Text className="text-white font-pmedium">Thêm gói</Text>
            </TouchableOpacity>
          </View>

          {service?.price && service.price.length > 0 ? (
            service.price.map((price) => (
              <View
                key={price.id}
                className="bg-gray-100 p-4 rounded-lg mb-3 flex-row justify-between items-center"
              >
                <View className="flex-1">
                  <Text className="font-pmedium" numberOfLines={2}>
                    {price.price_name}
                  </Text>
                  <Text className="font-pbold text-primary-500">
                    {formatToVND(price.price_value)}
                  </Text>
                </View>
                <View className="flex-row">
                  <TouchableOpacity
                    onPress={() => {
                      setSelectedPrice(price);
                      setPriceForm({
                        price_name: price.price_name,
                        price_value: formatPriceInput(
                          price.price_value.toString()
                        ),
                      });

                      const linkedBenefitIds: number[] = [];
                      if (service?.benefit) {
                        service.benefit.forEach((benefit) => {
                          if (
                            Array.isArray(benefit.price_id) &&
                            benefit.price_id.includes(price.id)
                          ) {
                            linkedBenefitIds.push(benefit.id);
                          }
                        });
                      }
                      setLinkedBenefits(linkedBenefitIds);
                      setBenefitsToDetach([]);

                      setSelectedBenefitsForPrice([]);
                      setShowEditPriceModal(true);
                    }}
                    className="mr-3"
                  >
                    <Ionicons name="create-outline" size={20} color="black" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      handleDeletePrice(price.id);
                    }}
                  >
                    <Ionicons name="trash-outline" size={20} color="red" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          ) : (
            <Text className="text-center text-gray-500 py-4">
              Chưa có gói dịch vụ nào
            </Text>
          )}
        </View>

        {/* Lợi ích dịch vụ */}
        <View className="p-5 bg-white mt-2">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="font-pbold text-xl">Lợi ích dịch vụ</Text>
            <TouchableOpacity
              onPress={() => {
                setBenefitForm({ benefit_name: "", price_id: [] });
                setShowAddBenefitModal(true);
              }}
              className="bg-primary-500 px-3 py-1 rounded-full"
            >
              <Text className="text-white font-pmedium">Thêm lợi ích</Text>
            </TouchableOpacity>
          </View>

          {service?.benefit && service.benefit.length > 0 ? (
            service.benefit.map((benefit) => (
              <View
                key={benefit.id}
                className="bg-gray-100 p-4 rounded-lg mb-3"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="font-pmedium flex-1 mr-2">
                    {benefit.benefit_name}
                  </Text>
                  <View className="flex-row">
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedBenefit(benefit);
                        setBenefitForm({
                          benefit_name: benefit.benefit_name,
                          price_id: benefit.price_id || [],
                        });
                        setShowEditBenefitModal(true);
                      }}
                      className="mr-3"
                    >
                      <Ionicons name="create-outline" size={20} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => {
                        handleDeleteBenefit(benefit.id);
                      }}
                    >
                      <Ionicons name="trash-outline" size={20} color="red" />
                    </TouchableOpacity>
                  </View>
                </View>

                {benefit.price_id && benefit.price_id.length > 0 ? (
                  <View className="mt-2">
                    <View className="flex-row flex-wrap mt-1">
                      {service.price
                        ?.filter(
                          (price) =>
                            Array.isArray(benefit.price_id) &&
                            benefit.price_id.includes(price.id)
                        )
                        .map((price) => (
                          <View
                            key={price.id}
                            className="px-3 py-1 rounded-full mr-2 mt-1 bg-gray-200"
                          >
                            <Text className="text-sm text-gray-600">
                              {price.price_name}
                            </Text>
                          </View>
                        ))}
                    </View>
                  </View>
                ) : (
                  <Text className="text-gray-500 mt-1 italic text-sm">
                    Lợi ích độc lập - Chưa gắn với gói nào
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text className="text-center text-gray-500 py-4">
              Chưa có lợi ích nào được thêm
            </Text>
          )}
        </View>

        {/* Thống kê */}
        <View className="p-5 bg-white mt-2">
          <Text className="font-pbold text-xl mb-4">Thống kê</Text>
          <View className="flex-row justify-between">
            <View className="items-center bg-gray-100 p-4 rounded-lg flex-1 mr-2">
              <Text className="font-pmedium text-gray-600">Lượt xem</Text>
              <Text className="font-pbold text-xl mt-1">
                {service?.view_count || 0}
              </Text>
            </View>
            <View className="items-center bg-gray-100 p-4 rounded-lg flex-1 ml-2">
              <Text className="font-pmedium text-gray-600">Lượt đặt</Text>
              <Text className="font-pbold text-xl mt-1">
                {service?.order_count || 0}
              </Text>
            </View>
          </View>
        </View>

        {/* Bình luận */}
        <View className="p-5 bg-white mt-2">
          <View className="flex-row justify-between items-center mb-4">
            <View>
              <Text className="font-pbold text-xl">Bình luận</Text>
              <RatingStar
                rating={service?.average_rate ?? 0}
                showRateNumber
                maxStar={5}
                isAverage={true}
              />
              <Text className="font-pregular">
                {service?.comment_count || 0} đánh giá
              </Text>
            </View>
            <TouchableOpacity
              onPress={async () => {
                setShowCommentsModal(true);
              }}
              className="bg-primary-500 px-3 py-1 rounded-full"
            >
              <Text className="text-white font-pmedium">Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {serviceComments.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="gap-4"
            >
              {serviceComments.slice(0, 3).map((comment) => (
                <CommentCard
                  key={comment.id}
                  data={comment}
                  user={comment.user}
                  containerStyles="w-72"
                />
              ))}
            </ScrollView>
          ) : (
            <View className="items-center py-8">
              <Ionicons name="chatbubble-outline" size={48} color="gray" />
              <Text className="text-gray-500 mt-2 font-pmedium">
                Chưa có bình luận nào
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showEditModal}
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-row items-center bg-white p-4">
          <TouchableOpacity
            onPress={() => setShowEditModal(false)}
            className="mr-4"
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text className="font-pbold text-xl">Chỉnh sửa dịch vụ</Text>
        </View>

        <ScrollView className="p-4">
          <View className="gap-4">
            <InputField
              nameField="Tên dịch vụ"
              placeholder="Nhập tên dịch vụ"
              value={formData.service_name}
              onChangeText={(text) =>
                setFormData({ ...formData, service_name: text })
              }
              rules={rules.service_name}
              required
            />

            <InputField
              nameField="Mô tả dịch vụ"
              placeholder="Nhập mô tả chi tiết về dịch vụ"
              value={formData.service_description}
              onChangeText={(text) =>
                setFormData({ ...formData, service_description: text })
              }
              rules={rules.service_description}
              multiline
              required
            />

            <LocationInputField
              nameField="Địa chỉ"
              placeholder="Nhập địa chỉ cung cấp dịch vụ"
              value={formData.location_name}
              onChangeText={(text) =>
                setFormData({ ...formData, location_name: text })
              }
              rules={rules.location_name}
              required
              onLocationSelected={handleLocationSelected}
            />

            <View>
              <Text className="font-pmedium text-base mb-2">
                Danh mục dịch vụ
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row gap-2"
              >
                {categories?.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full border ${
                      selectedCategory === category.id
                        ? "bg-primary-500 border-primary-500"
                        : "border-gray-300"
                    }`}
                  >
                    <Text
                      className={`font-pmedium ${
                        selectedCategory === category.id
                          ? "text-white"
                          : "text-gray-700"
                      }`}
                    >
                      {category.category_name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Phần quản lý hình ảnh */}
            <View>
              <Text className="font-pmedium text-base mb-2">
                Hình ảnh dịch vụ
              </Text>

              {/* Hiển thị hình ảnh đã chọn */}
              {images.length > 0 ? (
                <View className="flex-row flex-wrap">
                  {images.map((image, index) => (
                    <View key={index} className="w-1/3 p-1 relative">
                      <Image
                        source={{ uri: image }}
                        className="w-full h-24 rounded-md"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-black/50 rounded-full p-1"
                      >
                        <Ionicons name="close" size={16} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="items-center justify-center py-4 bg-gray-100 rounded-lg">
                  <Ionicons name="image-outline" size={48} color="gray" />
                  <Text className="text-gray-500 mt-2">Chưa có hình ảnh</Text>
                </View>
              )}

              {/* Nút thêm hình ảnh */}
              <TouchableOpacity
                onPress={pickImages}
                className="mt-3 bg-primary-500 py-2 px-4 rounded-lg flex-row justify-center items-center"
              >
                <Ionicons name="add" size={20} color="white" />
                <Text className="text-white font-pmedium ml-2">
                  Thêm hình ảnh
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View className="p-4 bg-white">
          <CustomButton
            title={isUploading ? "Đang cập nhật..." : "Cập nhật dịch vụ"}
            onPress={handleUpdateService}
            containerStyles={`${isValid && !isUploading ? "bg-primary-500" : "bg-primary-400"}`}
            isDisabled={!isValid || isUploading}
          />
        </View>
      </Modal>

      {/* Modal thêm gói dịch vụ */}
      <Modal
        visible={showAddPriceModal}
        animationType="slide"
        onRequestClose={() => setShowAddPriceModal(false)}
      >
        <View className="flex-row items-center bg-white p-4">
          <TouchableOpacity
            onPress={() => setShowAddPriceModal(false)}
            className="mr-4"
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text className="font-pbold text-xl">Thêm gói dịch vụ</Text>
        </View>

        <ScrollView className="p-4">
          <View className="mb-4">
            <InputField
              nameField="Tên gói dịch vụ"
              placeholder="Nhập tên gói dịch vụ"
              value={priceForm.price_name}
              onChangeText={(text) => {
                setPriceForm((prev) => ({ ...prev, price_name: text }));

                if (!text.trim()) {
                  setPriceErrors((prev) => ({
                    ...prev,
                    price_name: "Tên gói dịch vụ không được để trống",
                  }));
                } else if (text.trim().length < 3) {
                  setPriceErrors((prev) => ({
                    ...prev,
                    price_name: "Tên gói dịch vụ phải có ít nhất 3 ký tự",
                  }));
                } else {
                  setPriceErrors((prev) => ({ ...prev, price_name: "" }));
                }
              }}
              rules={[
                {
                  isValid: !priceErrors.price_name,
                  message: priceErrors.price_name,
                },
              ]}
              required
            />
          </View>

          <View className="mb-4">
            <InputField
              nameField="Giá gói dịch vụ (VNĐ)"
              placeholder="Nhập giá gói dịch vụ"
              value={priceForm.price_value}
              onChangeText={(text) => {
                const formattedText = formatPriceInput(text);
                setPriceForm((prev) => ({
                  ...prev,
                  price_value: formattedText,
                }));

                if (!formattedText.trim()) {
                  setPriceErrors((prev) => ({
                    ...prev,
                    price_value: "Giá gói dịch vụ không được để trống",
                  }));
                } else {
                  const priceValue = parseInt(formattedText.replace(/\D/g, ""));
                  if (isNaN(priceValue) || priceValue <= 0) {
                    setPriceErrors((prev) => ({
                      ...prev,
                      price_value: "Giá gói dịch vụ phải là số dương",
                    }));
                  } else if (priceValue < 1000) {
                    setPriceErrors((prev) => ({
                      ...prev,
                      price_value:
                        "Giá gói dịch vụ phải lớn hơn hoặc bằng 1.000 VND",
                    }));
                  } else {
                    setPriceErrors((prev) => ({ ...prev, price_value: "" }));
                  }
                }
              }}
              rules={[
                {
                  isValid: !priceErrors.price_value,
                  message: priceErrors.price_value,
                },
              ]}
              keyBoardType="numeric"
              required
            />
          </View>

          {/* Phần chọn benefits */}
          {service?.benefit && service.benefit.length > 0 && (
            <View className="mb-4">
              <Text className="font-pmedium mb-2">Các lợi ích áp dụng:</Text>

              {/* Nút chọn/bỏ chọn tất cả */}
              <View className="flex-row justify-between mb-2">
                <TouchableOpacity
                  onPress={() => selectAllBenefits(true)}
                  className="bg-blue-500 px-3 py-1 rounded"
                >
                  <Text className="text-white font-pmedium">Chọn tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => selectAllBenefits(false)}
                  className="bg-gray-500 px-3 py-1 rounded"
                >
                  <Text className="text-white font-pmedium">
                    Bỏ chọn tất cả
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white p-3 rounded-lg border border-gray-300">
                {service.benefit.map((benefit) => (
                  <TouchableOpacity
                    key={benefit.id}
                    onPress={() => toggleBenefitForPrice(benefit.id)}
                    className="flex-row items-center py-2 border-b border-gray-100"
                  >
                    <View
                      className={`w-6 h-6 rounded-md border mr-2 items-center justify-center ${
                        selectedBenefitsForPrice.includes(benefit.id)
                          ? "bg-primary-500 border-primary-500"
                          : "border-gray-400"
                      }`}
                    >
                      {selectedBenefitsForPrice.includes(benefit.id) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text className="font-pmedium">{benefit.benefit_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="mt-2 flex-row justify-end">
                <TouchableOpacity
                  onPress={() => setShowAddBenefitModal(true)}
                  className="bg-gray-200 py-1 px-3 rounded-full"
                >
                  <Text className="font-pmedium text-gray-700">
                    + Thêm lợi ích mới
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Nút thao tác đặt ở đây, sau các mục nhập */}
          <View className="mt-4 mb-10">
            <CustomButton
              title="Thêm gói dịch vụ"
              onPress={handleAddPrice}
              containerStyles={`${isPriceFormValid ? "bg-primary-500" : "bg-primary-300"}`}
              isDisabled={!isPriceFormValid}
            />
          </View>
        </ScrollView>
      </Modal>

      {/* Modal xác nhận xóa dịch vụ */}
      <Modal
        visible={showDeleteConfirm}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteConfirm(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-xl p-5 w-full max-w-sm">
            <Text className="font-pbold text-xl text-center">Xác nhận xóa</Text>
            <Text className="text-center my-4">
              Bạn có chắc chắn muốn xóa dịch vụ này? Hành động này không thể
              hoàn tác.
            </Text>
            <View className="flex-row justify-between mt-2">
              <TouchableOpacity
                onPress={() => setShowDeleteConfirm(false)}
                className="bg-gray-200 py-2 px-4 rounded-lg flex-1 mr-2"
              >
                <Text className="text-center font-pmedium">Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteService}
                className="bg-red-500 py-2 px-4 rounded-lg flex-1 ml-2"
              >
                <Text className="text-center font-pmedium text-white">Xóa</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal xem tất cả bình luận */}
      <Modal
        visible={showCommentsModal}
        animationType="slide"
        onRequestClose={() => setShowCommentsModal(false)}
      >
        <View className="flex-row items-center bg-white p-4">
          <TouchableOpacity
            onPress={() => setShowCommentsModal(false)}
            className="mr-4"
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text className="font-pbold text-xl">Bình luận</Text>
        </View>
        <FlatList
          data={serviceComments}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshingComment}
              onRefresh={refreshComment}
            />
          }
          onEndReached={loadMoreComment}
          onEndReachedThreshold={0.5}
          keyExtractor={(item, index) => index.toString()}
          ListFooterComponent={() =>
            isLoadMoreComment && (
              <ActivityIndicator size={"small"} color={"black"} />
            )
          }
          renderItem={({ item }) => (
            <View className="px-4 py-2">
              <CommentCard
                data={item}
                user={item.user}
                containerStyles="w-full"
                enableOption
                handleDeleteComment={handleDeleteComment}
              />
            </View>
          )}
          contentContainerClassName="py-4"
          ListEmptyComponent={
            <View className="items-center justify-center py-8">
              <Ionicons name="chatbubble-outline" size={48} color="gray" />
              <Text className="text-gray-500 mt-2 font-pmedium">
                Chưa có bình luận nào
              </Text>
            </View>
          }
        />
      </Modal>
      <Modal
        visible={showAddBenefitModal}
        animationType="slide"
        onRequestClose={() => setShowAddBenefitModal(false)}
      >
        <View className="flex-row items-center bg-white p-4">
          <TouchableOpacity
            onPress={() => setShowAddBenefitModal(false)}
            className="mr-4"
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text className="font-pbold text-xl">Thêm lợi ích dịch vụ</Text>
        </View>

        <ScrollView className="p-4">
          <View className="mb-4">
            <InputField
              nameField="Tên lợi ích"
              placeholder={`Ví dụ: ${getRandomBenefitExample()}`}
              value={benefitForm.benefit_name}
              onChangeText={(text) => {
                setBenefitForm((prev) => ({ ...prev, benefit_name: text }));

                if (!text.trim()) {
                  setBenefitErrors((prev) => ({
                    ...prev,
                    benefit_name: "Tên lợi ích không được để trống",
                  }));
                } else if (text.trim().length < 3) {
                  setBenefitErrors((prev) => ({
                    ...prev,
                    benefit_name: "Tên lợi ích phải có ít nhất 3 ký tự",
                  }));
                } else if (text.trim().length > 50) {
                  setBenefitErrors((prev) => ({
                    ...prev,
                    benefit_name: "Tên lợi ích không được vượt quá 50 ký tự",
                  }));
                } else {
                  setBenefitErrors((prev) => ({ ...prev, benefit_name: "" }));
                }
              }}
              rules={[
                {
                  isValid: !benefitErrors.benefit_name,
                  message: benefitErrors.benefit_name,
                },
              ]}
              required
            />
          </View>

          {service?.price && service.price.length > 0 && (
            <View className="mb-4">
              <Text className="font-pmedium mb-2">Áp dụng cho các gói:</Text>

              {/* Nút chọn/bỏ chọn tất cả */}
              <View className="flex-row justify-between mb-2">
                <TouchableOpacity
                  onPress={() => selectAllBenefits(true)}
                  className="bg-blue-500 px-3 py-1 rounded"
                >
                  <Text className="text-white font-pmedium">Chọn tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => selectAllBenefits(false)}
                  className="bg-gray-500 px-3 py-1 rounded"
                >
                  <Text className="text-white font-pmedium">
                    Bỏ chọn tất cả
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white p-3 rounded-lg border border-gray-300 mb-2">
                {service.price.map((price) => (
                  <TouchableOpacity
                    key={price.id}
                    onPress={() => togglePriceSelection(price.id)}
                    className="flex-row items-center py-2 border-b border-gray-100"
                  >
                    <View
                      className={`w-6 h-6 rounded-md border mr-2 items-center justify-center ${
                        benefitForm.price_id.includes(price.id)
                          ? "bg-primary-500 border-primary-500"
                          : "border-gray-400"
                      }`}
                    >
                      {benefitForm.price_id.includes(price.id) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text className="font-pmedium">{price.price_name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="bg-blue-100 p-2 rounded-lg mb-2">
                <Text className="text-blue-800 font-pmedium text-sm">
                  Nếu không chọn gói nào, lợi ích sẽ được tạo dưới dạng "lợi ích
                  độc lập" và không áp dụng cho gói cụ thể nào. Bạn có thể gán
                  lợi ích này cho các gói dịch vụ sau.
                </Text>
              </View>
            </View>
          )}

          <View className="bg-blue-100 p-3 rounded-lg mb-4">
            <Text className="text-blue-800 font-pmedium">
              Ví dụ về lợi ích dịch vụ:
            </Text>
            <View className="ml-2 mt-1">
              {benefitExamples.map((example, index) => (
                <Text key={index} className="text-blue-700 text-sm">
                  • {example}
                </Text>
              ))}
            </View>
          </View>

          {/* Nút thao tác đặt ở đây, sau các mục nhập */}
          <View className="mt-4 mb-10">
            <CustomButton
              title="Thêm lợi ích"
              onPress={handleAddBenefit}
              containerStyles={`${isBenefitFormValid ? "bg-primary-500" : "bg-primary-300"}`}
              isDisabled={!isBenefitFormValid}
            />
          </View>
        </ScrollView>
      </Modal>

      {/* Modal chỉnh sửa lợi ích */}
      <Modal
        visible={showEditBenefitModal}
        animationType="slide"
        onRequestClose={() => setShowEditBenefitModal(false)}
      >
        <View className="flex-row items-center bg-white p-4">
          <TouchableOpacity
            onPress={() => setShowEditBenefitModal(false)}
            className="mr-4"
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text className="font-pbold text-xl">Chỉnh sửa lợi ích</Text>
        </View>

        <ScrollView className="p-4">
          <View className="mb-4">
            <InputField
              nameField="Tên lợi ích"
              placeholder={`Ví dụ: ${getRandomBenefitExample()}`}
              value={benefitForm.benefit_name}
              onChangeText={(text) =>
                setBenefitForm((prev) => ({ ...prev, benefit_name: text }))
              }
              rules={[
                {
                  isValid: !benefitErrors.benefit_name,
                  message: benefitErrors.benefit_name,
                },
              ]}
              required
            />
          </View>

          {service?.price && service.price.length > 0 && (
            <View className="mb-4">
              <Text className="font-pmedium mb-2">Áp dụng cho các gói:</Text>

              {/* Nút chọn/bỏ chọn tất cả */}
              <View className="flex-row justify-between mb-2">
                <TouchableOpacity
                  onPress={() => selectAllBenefits(true)}
                  className="bg-blue-500 px-3 py-1 rounded"
                >
                  <Text className="text-white font-pmedium">Chọn tất cả</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => selectAllBenefits(false)}
                  className="bg-gray-500 px-3 py-1 rounded"
                >
                  <Text className="text-white font-pmedium">
                    Bỏ chọn tất cả
                  </Text>
                </TouchableOpacity>
              </View>

              <View className="bg-white p-3 rounded-lg border border-gray-300 mb-2">
                {service.price.map((price) => (
                  <TouchableOpacity
                    key={price.id}
                    onPress={() => togglePriceSelection(price.id)}
                    className="flex-row items-center py-2 border-b border-gray-100"
                  >
                    <View
                      className={`w-6 h-6 rounded-md border mr-2 items-center justify-center ${
                        benefitForm.price_id.includes(price.id)
                          ? "bg-primary-500 border-primary-500"
                          : "border-gray-400"
                      }`}
                    >
                      {benefitForm.price_id.includes(price.id) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <View className="flex-1">
                      <Text className="font-pmedium">{price.price_name}</Text>
                      {benefitForm.price_id.includes(price.id) && (
                        <Text className="text-green-600 text-xs">
                          Đã áp dụng
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
              <View className="bg-blue-100 p-2 rounded-lg mb-2">
                <Text className="text-blue-800 font-pmedium text-sm">
                  Chọn thêm gói mới sẽ áp dụng lợi ích cho các gói đó. Hiện tại,
                  hệ thống chỉ hỗ trợ thêm liên kết mới, không thể xóa các liên
                  kết đã tạo từ trước thông qua chức năng này.
                </Text>
              </View>
            </View>
          )}

          <View className="bg-blue-100 p-3 rounded-lg mb-4">
            <Text className="text-blue-800 font-pmedium">Thông tin:</Text>
            <Text className="text-blue-700 text-sm mt-1">
              • Lợi ích độc lập: không liên kết với gói nào, có thể gán cho các
              gói sau này.
            </Text>
            <Text className="text-blue-700 text-sm mt-1">
              • Lợi ích đã liên kết: đã áp dụng cho một hoặc nhiều gói dịch vụ.
            </Text>
          </View>

          {/* Nút thao tác đặt ở đây, sau các mục nhập */}
          <View className="mt-4 mb-10">
            <CustomButton
              title="Cập nhật lợi ích"
              onPress={handleUpdateBenefit}
              containerStyles={`${isBenefitFormValid ? "bg-primary-500" : "bg-primary-300"}`}
              isDisabled={!isBenefitFormValid}
            />
          </View>
        </ScrollView>
      </Modal>

      {/* Modal chỉnh sửa gói dịch vụ */}
      <Modal
        visible={showEditPriceModal}
        animationType="slide"
        onRequestClose={() => setShowEditPriceModal(false)}
      >
        <View className="flex-row items-center bg-white p-4">
          <TouchableOpacity
            onPress={() => setShowEditPriceModal(false)}
            className="mr-4"
          >
            <Ionicons name="close" size={24} color="black" />
          </TouchableOpacity>
          <Text className="font-pbold text-xl">Chỉnh sửa gói dịch vụ</Text>
        </View>

        <ScrollView className="p-4">
          <View className="mb-4">
            <InputField
              nameField="Tên gói dịch vụ"
              placeholder="Nhập tên gói dịch vụ"
              value={priceForm.price_name}
              onChangeText={(text) =>
                setPriceForm((prev) => ({ ...prev, price_name: text }))
              }
              rules={[
                {
                  isValid: !priceErrors.price_name,
                  message: priceErrors.price_name,
                },
              ]}
              required
            />
          </View>

          <View className="mb-4">
            <InputField
              nameField="Giá gói dịch vụ (VNĐ)"
              placeholder="Nhập giá gói dịch vụ"
              value={priceForm.price_value}
              onChangeText={(text) =>
                setPriceForm((prev) => ({
                  ...prev,
                  price_value: formatPriceInput(text),
                }))
              }
              rules={[
                {
                  isValid: !priceErrors.price_value,
                  message: priceErrors.price_value,
                },
              ]}
              keyBoardType="numeric"
              required
            />
          </View>

          {/* Phần chọn benefits */}
          {service?.benefit && service.benefit.length > 0 && (
            <View className="mb-4">
              <Text className="font-pmedium mb-2">Các lợi ích áp dụng:</Text>

              {/* Các benefits đã liên kết */}
              {linkedBenefits.length > 0 && (
                <View className="mb-2">
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm font-pmedium text-gray-700">
                      Lợi ích đã liên kết:
                    </Text>
                    {/* Nút bỏ chọn/khôi phục tất cả */}
                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={detachAllBenefits}
                        className="bg-red-500 px-2 py-1 rounded mr-1"
                      >
                        <Text className="text-white text-xs">Bỏ tất cả</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={restoreAllBenefits}
                        className="bg-green-500 px-2 py-1 rounded"
                      >
                        <Text className="text-white text-xs">Khôi phục</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="bg-white p-3 rounded-lg border border-gray-300">
                    {service.benefit
                      .filter((benefit) => linkedBenefits.includes(benefit.id))
                      .map((benefit) => (
                        <TouchableOpacity
                          key={benefit.id}
                          onPress={() => toggleLinkedBenefit(benefit.id)}
                          className="flex-row items-center py-2 border-b border-gray-100"
                        >
                          <View
                            className={`w-6 h-6 rounded-md border mr-2 items-center justify-center ${
                              benefitsToDetach.includes(benefit.id)
                                ? "bg-red-500 border-red-500"
                                : "bg-green-500 border-green-500"
                            }`}
                          >
                            {!benefitsToDetach.includes(benefit.id) ? (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="white"
                              />
                            ) : (
                              <Ionicons name="close" size={16} color="white" />
                            )}
                          </View>
                          <View className="flex-1">
                            <Text className="font-pmedium">
                              {benefit.benefit_name}
                            </Text>
                            {benefitsToDetach.includes(benefit.id) ? (
                              <Text className="text-red-600 text-xs">
                                Huỷ liên kết với lợi ích này
                              </Text>
                            ) : (
                              <Text className="text-green-600 text-xs">
                                Đã liên kết
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              )}

              {/* Các benefits có thể thêm */}

              {service.benefit.filter(
                (benefit) => !linkedBenefits.includes(benefit.id)
              ).length > 0 && (
                <View>
                  <View className="flex-row justify-between mb-1">
                    <Text className="text-sm font-pmedium text-gray-700">
                      Thêm lợi ích mới:
                    </Text>
                    {/* Nút chọn/bỏ chọn tất cả benefits mới */}
                    <View className="flex-row">
                      <TouchableOpacity
                        onPress={() => selectAllBenefits(true)}
                        className="bg-blue-500 px-2 py-1 rounded mr-1"
                      >
                        <Text className="text-white text-xs">Chọn tất cả</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => selectAllBenefits(false)}
                        className="bg-gray-500 px-2 py-1 rounded"
                      >
                        <Text className="text-white text-xs">Bỏ chọn</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <View className="bg-white p-3 rounded-lg border border-gray-300">
                    {service.benefit
                      .filter((benefit) => !linkedBenefits.includes(benefit.id))
                      .map((benefit) => (
                        <TouchableOpacity
                          key={benefit.id}
                          onPress={() => toggleBenefitForPrice(benefit.id)}
                          className="flex-row items-center py-2 border-b border-gray-100"
                        >
                          <View
                            className={`w-6 h-6 rounded-md border mr-2 items-center justify-center ${
                              selectedBenefitsForPrice.includes(benefit.id)
                                ? "bg-primary-500 border-primary-500"
                                : "border-gray-400"
                            }`}
                          >
                            {selectedBenefitsForPrice.includes(benefit.id) && (
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="white"
                              />
                            )}
                          </View>
                          <Text className="font-pmedium">
                            {benefit.benefit_name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                  </View>
                </View>
              )}

              <View className="mt-2 flex-row justify-end">
                <TouchableOpacity
                  onPress={() => setShowAddBenefitModal(true)}
                  className="bg-gray-200 py-1 px-3 rounded-full"
                >
                  <Text className="font-pmedium text-gray-700">
                    + Thêm lợi ích mới
                  </Text>
                </TouchableOpacity>
              </View>
              <View className="bg-blue-100 p-2 rounded-lg mt-2">
                <Text className="text-blue-800 font-pmedium text-sm">
                  Bạn có thể bỏ chọn lợi ích đã liên kết hoặc thêm lợi ích mới
                  cho gói dịch vụ này. Sử dụng các nút "Chọn tất cả" và "Bỏ tất
                  cả" để quản lý nhanh.
                </Text>
              </View>
            </View>
          )}

          {/* Nút thao tác đặt ở đây, sau các mục nhập */}
          <View className="mt-4 mb-10">
            <CustomButton
              title="Cập nhật gói dịch vụ"
              onPress={handleUpdatePrice}
              containerStyles={`${isPriceFormValid ? "bg-primary-500" : "bg-primary-300"}`}
              isDisabled={!isPriceFormValid}
            />
          </View>
        </ScrollView>
      </Modal>

      {/* Thêm modal thông báo vào cuối component */}
      <CustomModal
        visible={modal.visible}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        onClose={closeModal}
        onConfirm={modal.onConfirm}
      />
    </View>
  );
};

export default ProviderServiceDetail;

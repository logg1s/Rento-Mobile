import { ServiceType } from "@/types/type";

export type ServiceCardProps = {
  data: ServiceType;
  containerStyles?: string;
  onPress?: () => void;
  showFavorite?: boolean;
};

export type CommentCardProp = {
  data: {
    id: number;
    rate: number;
    comment_body: string;
  };
};

export type CardPriceProp = {
  data: {
    discount?: number;
    name: string;
    price: number;
  };
};

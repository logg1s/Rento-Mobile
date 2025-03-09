import { ServiceType } from "@/types/type";

export type ServiceCardProps = {
  data: ServiceType;
  containerStyles?: string;
  onPressFavorite: () => void;
  onPress?: () => void;
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

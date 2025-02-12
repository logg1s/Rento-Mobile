export type ServiceCardProp = {
  data: {
    id: number;
    name: string;
    service: string;
    rating: number;
    priceRange: string;
    description: string;
    imageUrl: string;
    commentCount: number;
    isLike: boolean;
  };
};

export type CommentCardProp = {
  data: {
    id: number;
    name: string;
    rating: number;
    comment: string;
    imageUrl: string;
  };
};

export type CardPriceProp = {
  data: {
    discount?: number;
    name: string;
    price: number;
  };
};

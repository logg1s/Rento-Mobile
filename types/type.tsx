export type ServiceCardProp = {
  data: {
    name: string;
    service: string;
    rating: number;
    priceRange: string;
    description: string;
    imageUrl: string;
    commentCount: string;
    isLike: boolean;
  };
};

export type CardPriceProp = {
  data: {
    discount?: number;
    name: string;
    price: number;
  };
};

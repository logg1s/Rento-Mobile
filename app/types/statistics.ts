export interface StatisticsService {
  id: number;
  name: string;
  base_price: number;
  order_count: number;
  revenue: number;
  average_rating: number;
  review_count: number;
  revenue_per_order: number;
  profit_margin: number;
}

export interface RevenueStatistics {
  labels: string[];
  data: number[];
  order_counts: number[];
  total: number;
  average: number;
  daily_average: number;
  max_revenue: {
    value: number;
    date: string | null;
  };
  min_revenue: {
    value: number;
    date: string | null;
  };
  trend: number;
}

export interface OrderTrends {
  labels: string[];
  data: number[];
  completed: number[];
  cancelled: number[];
}

export interface OrderStatistics {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  in_progress: number;
  completion_rate: number;
  cancellation_rate: number;
  busiest_day: string | null;
  max_orders: number;
  daily_average: number;
  trends: OrderTrends;
}

export interface CategoryStatistics {
  id: number;
  name: string;
  order_count: number;
  revenue: number;
}

export interface ServiceStatistics {
  services: StatisticsService[];
  total_services: number;
  active_services: number;
  service_categories: CategoryStatistics[];
  most_popular: string | null;
  highest_rated: string | null;
  most_profitable: string | null;
}

export interface OrderValueRange {
  min: number;
  max: number;
  label: string;
  count: number;
}

export interface CustomerInsights {
  total_customers: number;
  repeat_customers: number;
  repeat_rate: number;
  order_value_distribution: OrderValueRange[];
  rating_distribution: Record<string, number>;
}

export interface SummaryStatistics {
  total_services: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  average_rating: number;
  total_customers: number;
  customer_lifetime_value: number;
}

export interface PeriodInfo {
  start_date: string;
  end_date: string;
  period: string;
  days: number;
}

export interface ComparisonData {
  current_value: number;
  previous_value: number;
  growth_percentage: number;
  is_positive: boolean;
}

export interface StatisticsComparison {
  revenue: ComparisonData;
  orders: ComparisonData;
}

export interface ProviderStatistics {
  revenue: RevenueStatistics;
  orders: OrderStatistics;
  services: ServiceStatistics;
  customer_insights: CustomerInsights;
  summary: SummaryStatistics;
  period_info: PeriodInfo;
  comparison?: StatisticsComparison;
}

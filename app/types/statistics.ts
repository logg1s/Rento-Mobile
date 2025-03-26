/**
 * Statistics-related interfaces matching the Laravel backend response structure
 */

// Service type returned in statistics
export interface StatisticsService {
  id: number;
  name: string;
  order_count: number;
  revenue: number;
  average_rating: number;
  review_count: number;
}

// Revenue statistics
export interface RevenueStatistics {
  labels: string[];
  data: number[];
  total: number;
  average: number;
  trend: number;
}

// Order statistics
export interface OrderStatistics {
  total: number;
  completed: number;
  cancelled: number;
  pending: number;
  in_progress: number;
  completion_rate: number;
  cancellation_rate: number;
  trends: {
    labels: string[];
    data: number[];
  };
}

// Service effectiveness statistics
export interface ServiceStatistics {
  services: StatisticsService[];
  total_services: number;
  most_popular: string | null;
  highest_rated: string | null;
  most_profitable: string | null;
}

// Summary statistics
export interface SummaryStatistics {
  total_services: number;
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  average_rating: number;
}

// Full statistics object (response from API)
export interface ProviderStatistics {
  revenue: RevenueStatistics;
  orders: OrderStatistics;
  services: ServiceStatistics;
  summary: SummaryStatistics;
}

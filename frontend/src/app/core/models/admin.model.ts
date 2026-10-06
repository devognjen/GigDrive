/** Platform KPIs from GET /admin/stats. */
export interface AdminConcertStats {
  total: number;
  cached: number;
  userSubmitted: number;
  hidden: number;
}

export interface AdminStats {
  users: number;
  concerts: AdminConcertStats;
  tripsByStatus: Record<string, number>;
  bookingsByStatus: Record<string, number>;
  reviews: number;
}

/** Operator user row from GET /admin/users. */
export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  isAdmin: boolean;
  disabledAt: string | null;
  createdAt: string;
}

export interface AdminUserList {
  items: AdminUser[];
  total: number;
  page: number;
}

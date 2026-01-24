
// API Configuration
const API_CONFIG = {
  // Development URL
  BASE_URL: import.meta.env.VITE_API_BASE_URL,

  // Production URL (uncomment when deploying)
  // BASE_URL: "https://api.legalnetwork.in",

  // API endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH_ME: '/api/auth/me',

    // User endpoints
    USERS: '/api/users',
    USER_BY_ID: (id: string) => `/api/users/${id}`,

    // Client endpoints
    CLIENTS: '/api/clients',
    CLIENT_BY_ID: (id: string) => `/api/clients/${id}`,

    // Case endpoints
    CASES: '/api/cases',

    // Help & Support endpoints
    HELP_SUPPORT: '/api/help-support',

    // Admin endpoints
    ADMINS: '/api/admins',
    ADMINS_LOGIN: '/api/admins/login',
    ADMIN_BY_ID: (id: string) => `/api/admins/${id}`,

    // Sub-admin endpoints
    SUB_ADMINS: '/api/subAdmins',
    SUB_ADMINS_LOGIN: '/api/subAdmins/login',
    SUB_ADMIN_BY_ID: (id: string) => `/api/subAdmins/${id}`,

    // News endpoints
    NEWS: '/api/news',
    NEWS_BY_ID: (id: string) => `/api/news/${id}`,
    NEWS_INCREMENT_VIEWS: (id: string) => `/api/news/${id}/views/increment`,

    // Blog endpoints
    BLOGS: '/api/blogs',
    BLOG_BY_ID: (id: string) => `/api/blogs/${id}`,

    // Notification endpoints
    NOTIFICATIONS: '/api/notifications',
    NOTIFICATION_BY_ID: (id: string) => `/api/notifications/${id}`,

    // Query endpoints
    QUERIES_POST: '/api/queries',
    QUERIES_ALL: '/api/queries',
    QUERIES_BY_USER: (userId: string) => `/api/queries/user/${userId}`,
    QUERIES_BY_ID: (id: string) => `/api/queries/${id}`,

    // Service endpoints
    SERVICES: '/api/services',
    SERVICE_BY_ID: (id: string) => `/api/services/${id}`,

    // Service Booked endpoints
    SERVICES_BOOKED: '/api/services-booked',
    SERVICE_BOOKED_BY_ID: (id: string) => `/api/services-booked/${id}`,
    SERVICE_BOOKED_BY_CLIENT: (clientId: string) => `/api/services-booked/client/${clientId}`,

    // Delete Request endpoints
    DELETE_REQUESTS: '/api/delete-requests',
    DELETE_REQUEST_BY_ID: (id: string) => `/api/delete-requests/${id}`,
    DELETE_REQUESTS_BY_USER: (userId: string) => `/api/delete-requests/user/${userId}`,
    DELETE_REQUESTS_BY_STATUS: (status: string) => `/api/delete-requests/status/${status}`,
    DELETE_REQUEST_REVIEW: (id: string) => `/api/delete-requests/${id}/review`,
  }
};

// Helper function to get full URL
export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
};

// Pre-built API URLs for common endpoints
export const API_URLS = {
  // Auth URLs
  AUTH_ME: getApiUrl(API_CONFIG.ENDPOINTS.AUTH_ME),

  // User URLs
  USERS: getApiUrl(API_CONFIG.ENDPOINTS.USERS),
  USER_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.USER_BY_ID(id)),

  // Client URLs
  CLIENTS: getApiUrl(API_CONFIG.ENDPOINTS.CLIENTS),
  CLIENT_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.CLIENT_BY_ID(id)),

  // Admin URLs
  ADMINS: getApiUrl(API_CONFIG.ENDPOINTS.ADMINS),
  ADMINS_LOGIN: getApiUrl(API_CONFIG.ENDPOINTS.ADMINS_LOGIN),
  ADMIN_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.ADMIN_BY_ID(id)),

  // Sub-admin URLs
  SUB_ADMINS: getApiUrl(API_CONFIG.ENDPOINTS.SUB_ADMINS),
  SUB_ADMINS_LOGIN: getApiUrl(API_CONFIG.ENDPOINTS.SUB_ADMINS_LOGIN),
  SUB_ADMIN_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.SUB_ADMIN_BY_ID(id)),

  // News URLs
  NEWS: getApiUrl(API_CONFIG.ENDPOINTS.NEWS),
  NEWS_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.NEWS_BY_ID(id)),
  NEWS_INCREMENT_VIEWS: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.NEWS_INCREMENT_VIEWS(id)),

  // Blog URLs
  BLOGS: getApiUrl(API_CONFIG.ENDPOINTS.BLOGS),
  BLOG_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.BLOG_BY_ID(id)),

  // Notification URLs
  NOTIFICATIONS: getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATIONS),
  NOTIFICATION_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.NOTIFICATION_BY_ID(id)),

  // Query URLs
  QUERIES_POST: getApiUrl(API_CONFIG.ENDPOINTS.QUERIES_POST),
  QUERIES_ALL: getApiUrl(API_CONFIG.ENDPOINTS.QUERIES_ALL),
  QUERIES_BY_USER: (userId: string) => getApiUrl(API_CONFIG.ENDPOINTS.QUERIES_BY_USER(userId)),
  QUERIES_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.QUERIES_BY_ID(id)),

  // Service URLs
  SERVICES: getApiUrl(API_CONFIG.ENDPOINTS.SERVICES),
  SERVICE_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.SERVICE_BY_ID(id)),

  // Service Booked URLs
  SERVICES_BOOKED: getApiUrl(API_CONFIG.ENDPOINTS.SERVICES_BOOKED),
  SERVICE_BOOKED_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.SERVICE_BOOKED_BY_ID(id)),
  SERVICE_BOOKED_BY_CLIENT: (clientId: string) => getApiUrl(API_CONFIG.ENDPOINTS.SERVICE_BOOKED_BY_CLIENT(clientId)),

  // Delete Request URLs
  DELETE_REQUESTS: getApiUrl(API_CONFIG.ENDPOINTS.DELETE_REQUESTS),
  DELETE_REQUEST_BY_ID: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.DELETE_REQUEST_BY_ID(id)),
  DELETE_REQUESTS_BY_USER: (userId: string) => getApiUrl(API_CONFIG.ENDPOINTS.DELETE_REQUESTS_BY_USER(userId)),
  DELETE_REQUESTS_BY_STATUS: (status: string) => getApiUrl(API_CONFIG.ENDPOINTS.DELETE_REQUESTS_BY_STATUS(status)),
  DELETE_REQUEST_REVIEW: (id: string) => getApiUrl(API_CONFIG.ENDPOINTS.DELETE_REQUEST_REVIEW(id)),
};

// Types
type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type Json = Record<string, any>;

let AUTH_TOKEN: string | null = null;

export function setAuthToken(token: string | null) {
  AUTH_TOKEN = token;
}
export function clearAuthToken() {
  AUTH_TOKEN = null;
}

const enc = encodeURIComponent;

type RequestOpts<TBody> = {
  method?: HttpMethod;
  path: string;
  query?: Record<string, string | number | boolean | undefined>;
  body?: TBody;
  signal?: AbortSignal;
  headers?: Record<string, string>;
};

export type ApiError = { status: number; message: string; details?: unknown };

async function request<TResp, TBody = unknown>({
  method = "GET",
  path,
  query,
  body,
  signal,
  headers,
}: RequestOpts<TBody>): Promise<TResp> {
  const url = new URL(path.startsWith('http') ? path : getApiUrl(path));
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    });
  }
  const hasBody = body !== undefined && body !== null;

  const res = await fetch(url.toString(), {
    method,
    credentials: "include", // OK even if you don't use cookies
    headers: {
      ...(hasBody ? { "Content-Type": "application/json" } : {}),
      ...(AUTH_TOKEN ? { Authorization: `Bearer ${AUTH_TOKEN}` } : {}),
      ...headers,
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    cache: "no-store",
    signal,
  });

  const ct = res.headers.get("content-type") || "";
  const isJSON = ct.includes("application/json");

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let details: unknown = undefined;
    try {
      const j = isJSON ? await res.json() : await res.text();
      if (typeof j === "string") {
        message = j || message;
        details = j;
      } else {
        message = j?.error ?? j?.message ?? message;
        details = j;
      }
    } catch { }
    throw { status: res.status, message, details } as ApiError;
  }

  if (res.status === 204) return undefined as unknown as TResp;
  return (isJSON ? res.json() : (res.text() as unknown)) as Promise<TResp>;
}

// Default axios configuration
export const API_DEFAULT_CONFIG = {
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
};

/* --------------------------------- Auth ----------------------------------- */

export const AuthAPI = {
  me(signal?: AbortSignal) {
    return request<{ success?: boolean; user?: Json; data?: Json }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.AUTH_ME,
      signal,
    });
  },
  // login(body: { email: string; password: string }, signal?: AbortSignal) { ... }
  // register(...)
  // logout(...)
};

/* --------------------------------- Clients -------------------------------- */

export type Client = {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  profilePic?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ClientLogin = {
  email: string;
  password: string;
};

/* ----------------------------------- Cases ---------------------------------- */

export type Case = {
  id: string;
  createdById: string;
  caseNumber: string;
  caseTypeAndRegistration: string;
  firNumber: string;
  partitionarName: string;
  clientNumber: string;
  respondentName: string;
  secondPartyNumber: string;
  courtName: string;
  roomNumber: string;
  amountReceived?: number;
  judgeName: string;
  judgePost: string;
  remarks: string;
  purpose: string;
  status: 'OPEN' | 'CLOSED' | 'ADJOURNED';
  nextHearingDate?: string;
  lastHearingDate?: string;
  remindMeDate?: string;
  createdAt: string;
  updatedAt: string;
};

/* ----------------------------------- Help & Support ---------------------------------- */

export type HelpSupport = {
  id: string;
  userId: string;
  from: string;
  title: string;
  description: string;
  category: string;
  answer: string;
  status: 'PENDING' | 'ANSWERED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
};

export const ClientsAPI = {
  register(body: { fullName: string; email: string; password: string; phone?: string }, signal?: AbortSignal) {
    return request<{ success: boolean; data: Client }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.CLIENTS,
      body,
      signal,
    });
  },

  list(signal?: AbortSignal) {
    return request<{ success: boolean; data: Client[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.CLIENTS,
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: Client }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.CLIENT_BY_ID(enc(id)),
      signal,
    });
  },
  update(id: string, body: Partial<Client>, signal?: AbortSignal) {
    return request<{ success: boolean; data: Client }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.CLIENT_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  remove(id: string, signal?: AbortSignal) {
    return request<{ success: boolean }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.CLIENT_BY_ID(enc(id)),
      signal,
    });
  },
  removeAll(signal?: AbortSignal) {
    return request<{ success: boolean; deleted: number }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.CLIENTS,
      signal,
    });
  },
};

export const CasesAPI = {
  // Get all cases for a specific user
  getByUserId(createdById: string, params?: { status?: string; limit?: number }, signal?: AbortSignal) {
    const query = new URLSearchParams();
    if (params?.status) query.set('status', params.status);
    if (params?.limit) query.set('limit', params.limit.toString());

    return request<{ success: boolean; data: Case[]; count: number }>({
      method: "GET",
      path: `${API_CONFIG.ENDPOINTS.CASES}/user/${enc(createdById)}${query.toString() ? `?${query.toString()}` : ''}`,
      signal,
    });
  },

  // Get cases by status
  getByStatus(status: string, params?: { limit?: number }, signal?: AbortSignal) {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());

    return request<{ success: boolean; data: Case[]; count: number }>({
      method: "GET",
      path: `${API_CONFIG.ENDPOINTS.CASES}/status/${enc(status)}${query.toString() ? `?${query.toString()}` : ''}`,
      signal,
    });
  },

  // Get upcoming hearings
  getUpcomingHearings(params?: { limit?: number }, signal?: AbortSignal) {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());

    return request<{ success: boolean; data: Case[]; count: number }>({
      method: "GET",
      path: `${API_CONFIG.ENDPOINTS.CASES}/hearings/upcoming${query.toString() ? `?${query.toString()}` : ''}`,
      signal,
    });
  },

  // Get overdue reminders
  getOverdueReminders(signal?: AbortSignal) {
    return request<{ success: boolean; data: Case[]; count: number }>({
      method: "GET",
      path: `${API_CONFIG.ENDPOINTS.CASES}/reminders/overdue`,
      signal,
    });
  },

  // Get case by ID
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: Case }>({
      method: "GET",
      path: `${API_CONFIG.ENDPOINTS.CASES}/${enc(id)}`,
      signal,
    });
  },

  // Create new case
  create(body: Omit<Case, 'id' | 'createdAt' | 'updatedAt'>, signal?: AbortSignal) {
    return request<{ success: boolean; data: Case; message: string }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.CASES,
      body,
      signal,
    });
  },

  // Update case
  update(id: string, body: Partial<Case>, signal?: AbortSignal) {
    return request<{ success: boolean; data: Case; message: string }>({
      method: "PUT",
      path: `${API_CONFIG.ENDPOINTS.CASES}/${enc(id)}`,
      body,
      signal,
    });
  },

  // Delete case
  remove(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; message: string }>({
      method: "DELETE",
      path: `${API_CONFIG.ENDPOINTS.CASES}/${enc(id)}`,
      signal,
    });
  },
};

/* --------------------------------- Admins --------------------------------- */

export type Admin = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  isActive?: boolean;
  createdAt?: string;
};

export type AdminLogin = {
  email: string;
  password: string;
};

export const HelpSupportAPI = {
  // Get all help/support requests
  getAll(params?: { limit?: number; category?: string; status?: string; userId?: string }, signal?: AbortSignal) {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.category) query.set('category', params.category);
    if (params?.status) query.set('status', params.status);
    if (params?.userId) query.set('userId', params.userId);

    return request<{ success: boolean; data: HelpSupport[]; count: number }>({
      method: "GET",
      path: `${API_CONFIG.ENDPOINTS.HELP_SUPPORT}${query.toString() ? `?${query.toString()}` : ''}`,
      signal,
    });
  },

  // Get help/support request by ID
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: HelpSupport }>({
      method: "GET",
      path: `${API_CONFIG.ENDPOINTS.HELP_SUPPORT}/${enc(id)}`,
      signal,
    });
  },

  // Create new help/support request
  create(body: Omit<HelpSupport, 'id' | 'createdAt' | 'updatedAt'>, signal?: AbortSignal) {
    return request<{ success: boolean; data: HelpSupport; message: string }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.HELP_SUPPORT,
      body,
      signal,
    });
  },

  // Update help/support request (all fields)
  update(id: string, body: Partial<HelpSupport>, signal?: AbortSignal) {
    return request<{ success: boolean; data: HelpSupport; message: string }>({
      method: "PUT",
      path: `${API_CONFIG.ENDPOINTS.HELP_SUPPORT}/${enc(id)}`,
      body,
      signal,
    });
  },

  // Delete help/support request by ID
  remove(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; message: string }>({
      method: "DELETE",
      path: `${API_CONFIG.ENDPOINTS.HELP_SUPPORT}/${enc(id)}`,
      signal,
    });
  },

  // Delete all help/support requests
  removeAll(signal?: AbortSignal) {
    return request<{ success: boolean; message: string; deletedCount: number }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.HELP_SUPPORT,
      signal,
    });
  },
};

export const AdminsAPI = {
  create(body: { name: string; email: string; password: string; phoneNumber?: string; isActive?: boolean }, signal?: AbortSignal) {
    return request<{ success: boolean; data: Admin }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.ADMINS,
      body,
      signal,
    });
  },
  login(body: AdminLogin, signal?: AbortSignal) {
    return request<{ success: boolean; data: Admin }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.ADMINS_LOGIN,
      body,
      signal,
    });
  },
  list(signal?: AbortSignal, query?: { limit?: number; startAfter?: string }) {
    return request<{ success: boolean; data: Admin[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.ADMINS,
      query,
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: Admin }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.ADMIN_BY_ID(enc(id)),
      signal,
    });
  },
  update(id: string, body: Partial<Admin>, signal?: AbortSignal) {
    return request<{ success: boolean; data: Admin }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.ADMIN_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  remove(id: string, signal?: AbortSignal) {
    return request<{ success: boolean }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.ADMIN_BY_ID(enc(id)),
      signal,
    });
  },
  removeAll(signal?: AbortSignal) {
    return request<{ success: boolean; deleted: number }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.ADMINS,
      signal,
    });
  },
};

/* -------------------------------- Sub-Admins ----------------------------- */

export type SubAdmin = {
  id: string;
  name: string;
  email: string;
  phoneNumber?: string;
  role?: string;
  allowedTabs?: string[];
  isActive?: boolean;
  createdAt?: string;
};

export type SubAdminLogin = {
  email: string;
  password: string;
};

export const SubAdminsAPI = {
  create(body: { name: string; email: string; password: string; phoneNumber?: string; role?: string; allowedTabs?: string[]; isActive?: boolean }, signal?: AbortSignal) {
    return request<{ success: boolean; data: SubAdmin }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.SUB_ADMINS,
      body,
      signal,
    });
  },
  login(body: SubAdminLogin, signal?: AbortSignal) {
    return request<{ success: boolean; data: SubAdmin }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.SUB_ADMINS_LOGIN,
      body,
      signal,
    });
  },
  list(signal?: AbortSignal, query?: { limit?: number; startAfter?: string }) {
    return request<{ success: boolean; data: SubAdmin[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.SUB_ADMINS,
      query,
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: SubAdmin }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.SUB_ADMIN_BY_ID(enc(id)),
      signal,
    });
  },
  update(id: string, body: Partial<SubAdmin>, signal?: AbortSignal) {
    return request<{ success: boolean; data: SubAdmin }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.SUB_ADMIN_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  remove(id: string, signal?: AbortSignal) {
    return request<{ success: boolean }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.SUB_ADMIN_BY_ID(enc(id)),
      signal,
    });
  },
  removeAll(signal?: AbortSignal) {
    return request<{ success: boolean; deleted: number }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.SUB_ADMINS,
      signal,
    });
  },
};

/* --------------------------------- Users ---------------------------------- */

export type User = {
  id: string;
  email?: string;
  name?: string;
  role?: string;
  createdAt?: string;
  // add more fields that your controllers return
};

export const UsersAPI = {
  create(body: Partial<User>, signal?: AbortSignal) {
    return request<{ success: boolean; data: User }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.USERS,
      body,
      signal,
    });
  },
  list(signal?: AbortSignal) {
    return request<{ success: boolean; data: User[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.USERS,
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: User }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.USER_BY_ID(enc(id)),
      signal,
    });
  },
  update(id: string, body: Partial<User>, signal?: AbortSignal) {
    // PUT: replace all fields (per your router comment)
    return request<{ success: boolean; data: User }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.USER_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  remove(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.USER_BY_ID(enc(id)),
      signal,
    });
  },
  removeAll(signal?: AbortSignal) {
    // DANGER
    return request<{ success: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.USERS,
      signal,
    });
  },
};


/* --------------------------------- News ----------------------------------- */

export type NewsPost = {
  id: string;
  title: string;
  imageUrl?: string;
  description?: string;
  brief?: string;
  source?: string;
  liveLink?: string;
  category?: string;
  createdAt?: string;
  views?: number;
  isTrending?: boolean;
  published?: boolean;
};

export const NewsAPI = {
  create(body: Omit<NewsPost, "id">, signal?: AbortSignal) {
    return request<{ success?: boolean; data: NewsPost }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.NEWS,
      body,
      signal,
    });
  },
  list(params?: { category?: string; page?: number; limit?: number }, signal?: AbortSignal) {
    return request<{ success?: boolean; data: NewsPost[]; total?: number }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.NEWS,
      query: params,
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success?: boolean; data: NewsPost }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.NEWS_BY_ID(enc(id)),
      signal,
    });
  },
  updateById(id: string, body: Partial<NewsPost>, signal?: AbortSignal) {
    return request<{ success?: boolean; data: NewsPost }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.NEWS_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  deleteById(id: string, signal?: AbortSignal) {
    return request<{ success?: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.NEWS_BY_ID(enc(id)),
      signal,
    });
  },
  deleteAll(signal?: AbortSignal) {
    // DANGER
    return request<{ success?: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.NEWS,
      signal,
    });
  },
  incrementViews(id: string, signal?: AbortSignal) {
    return request<{ success?: boolean; data?: NewsPost; views?: number }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.NEWS_INCREMENT_VIEWS(enc(id)),
      signal,
    });
  },
};

/* --------------------------------- Blogs ---------------------------------- */

export type BlogPost = {
  id: string;
  title: string;
  category?: string;
  subtitle?: string;
  description: string;
  image?: string;
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const BlogsAPI = {
  create(body: Omit<BlogPost, "id">, signal?: AbortSignal) {
    return request<{ success?: boolean; data: BlogPost }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.BLOGS,
      body,
      signal,
    });
  },
  list(params?: { category?: string; published?: boolean; limit?: number; startAfter?: string }, signal?: AbortSignal) {
    return request<{ success?: boolean; data: BlogPost[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.BLOGS,
      query: params,
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success?: boolean; data: BlogPost }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.BLOG_BY_ID(enc(id)),
      signal,
    });
  },
  updateById(id: string, body: Partial<BlogPost>, signal?: AbortSignal) {
    return request<{ success?: boolean; data: BlogPost }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.BLOG_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  deleteById(id: string, signal?: AbortSignal) {
    return request<{ success?: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.BLOG_BY_ID(enc(id)),
      signal,
    });
  },
  deleteAll(signal?: AbortSignal) {
    return request<{ success?: boolean; deleted: number }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.BLOGS,
      signal,
    });
  },
};

/* ------------------------------ Notifications ---------------------------- */

export type Notification = {
  id: string;
  title: string;
  description: string;
  image?: string;
  published?: boolean;
  read?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export const NotificationsAPI = {
  create(body: Omit<Notification, "id">, signal?: AbortSignal) {
    return request<{ success?: boolean; data: Notification }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.NOTIFICATIONS,
      body,
      signal,
    });
  },
  list(params?: { published?: boolean; read?: boolean; limit?: number; startAfter?: string }, signal?: AbortSignal) {
    return request<{ success?: boolean; data: Notification[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.NOTIFICATIONS,
      query: params,
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success?: boolean; data: Notification }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.NOTIFICATION_BY_ID(enc(id)),
      signal,
    });
  },
  updateById(id: string, body: Partial<Notification>, signal?: AbortSignal) {
    return request<{ success?: boolean; data: Notification }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.NOTIFICATION_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  deleteById(id: string, signal?: AbortSignal) {
    return request<{ success?: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.NOTIFICATION_BY_ID(enc(id)),
      signal,
    });
  },
  deleteAll(signal?: AbortSignal) {
    return request<{ success?: boolean; deleted: number }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.NOTIFICATIONS,
      signal,
    });
  },
};

/* -------------------------------- Queries --------------------------------- */

export type QueryPost = {
  id: string;
  title: string;
  description?: string;
  askedByName?: string;
  askedById: string;
  answersCount?: number;
  source?: string;
  createdAt?: string; // Firestore ts as stringified
};

export const QueriesAPI = {
  create(body: Omit<QueryPost, "id" | "createdAt">, signal?: AbortSignal) {
    return request<{ success?: boolean; data: QueryPost }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.QUERIES_POST,
      body,
      signal,
    });
  },
  listAll(signal?: AbortSignal) {
    return request<{ success?: boolean; data: QueryPost[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.QUERIES_ALL,
      signal,
    });
  },
  listByUser(userId: string, signal?: AbortSignal) {
    return request<{ success?: boolean; data: QueryPost[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.QUERIES_BY_USER(enc(userId)),
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success?: boolean; data: QueryPost }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.QUERIES_BY_ID(enc(id)),
      signal,
    });
  },
  updateById(id: string, body: Partial<QueryPost>, signal?: AbortSignal) {
    return request<{ success?: boolean; data: QueryPost }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.QUERIES_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  deleteById(id: string, signal?: AbortSignal) {
    return request<{ success?: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.QUERIES_BY_ID(enc(id)),
      signal,
    });
  },
  deleteAll(signal?: AbortSignal) {
    // DANGER
    return request<{ success?: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.QUERIES_ALL,
      signal,
    });
  },
};

/* -------------------------------- Services -------------------------------- */

export type Service = {
  id: string;
  name: string;
  description?: string;
  categories: string[];
  number?: string;
  createdAt?: string;
  updatedAt?: string;
};

export const ServicesAPI = {
  create(body: Omit<Service, "id" | "createdAt" | "updatedAt">, signal?: AbortSignal) {
    return request<{ success: boolean; data: Service }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.SERVICES,
      body,
      signal,
    });
  },
  list(signal?: AbortSignal) {
    return request<{ success: boolean; data: Service[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.SERVICES,
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: Service }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.SERVICE_BY_ID(enc(id)),
      signal,
    });
  },
  updateById(id: string, body: Partial<Service>, signal?: AbortSignal) {
    return request<{ success: boolean; data: Service }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.SERVICE_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  deleteById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.SERVICE_BY_ID(enc(id)),
      signal,
    });
  },
  deleteAll(signal?: AbortSignal) {
    return request<{ success: boolean; deleted: number }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.SERVICES,
      signal,
    });
  },
};

/* --------------------------- Services Booked ------------------------------ */

export type ServiceBooked = {
  id: string;
  clientId: string;
  phoneNumber: string;
  title: string;
  description?: string;
  servicesBooked: string[];
  createdAt?: string;
  updatedAt?: string;
};

export const ServicesBookedAPI = {
  create(body: Omit<ServiceBooked, "id" | "createdAt" | "updatedAt">, signal?: AbortSignal) {
    return request<{ success: boolean; data: ServiceBooked }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.SERVICES_BOOKED,
      body,
      signal,
    });
  },
  list(signal?: AbortSignal) {
    return request<{ success: boolean; data: ServiceBooked[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.SERVICES_BOOKED,
      signal,
    });
  },
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: ServiceBooked }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.SERVICE_BOOKED_BY_ID(enc(id)),
      signal,
    });
  },
  getByClientId(clientId: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: ServiceBooked[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.SERVICE_BOOKED_BY_CLIENT(enc(clientId)),
      signal,
    });
  },
  updateById(id: string, body: Partial<ServiceBooked>, signal?: AbortSignal) {
    return request<{ success: boolean; data: ServiceBooked }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.SERVICE_BOOKED_BY_ID(enc(id)),
      body,
      signal,
    });
  },
  deleteById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; message?: string }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.SERVICE_BOOKED_BY_ID(enc(id)),
      signal,
    });
  },
  deleteAll(signal?: AbortSignal) {
    return request<{ success: boolean; deleted: number }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.SERVICES_BOOKED,
      signal,
    });
  },
};

/* -------------------------------- Support --------------------------------- */

export type SupportTicket = {
  id: string;
  userId: string;
  userType: 'CLIENT' | 'LAWYER' | 'ADMIN' | 'SUBADMIN';
  purpose: string;
  category: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  answers: SupportAnswer[];
  createdAt: string;
  updatedAt: string;
};

export type SupportAnswer = {
  id: string;
  answer: string;
  answeredBy: string;
  answeredByType: 'ADMIN' | 'SUBADMIN';
  answeredAt: string;
};

export type CreateSupportTicket = Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'answers'>;
export type UpdateSupportTicket = Partial<Omit<SupportTicket, 'id' | 'createdAt'>>;
export type AddSupportAnswer = {
  answer: string;
  answeredBy: string;
  answeredByType: 'ADMIN' | 'SUBADMIN';
};

export const SupportAPI = {
  // Create new support ticket
  create(body: CreateSupportTicket, signal?: AbortSignal) {
    return request<{ success: boolean; data: SupportTicket; message: string }>({
      method: "POST",
      path: "/api/support",
      body,
      signal,
    });
  },

  // Get all support tickets with pagination and filters
  getAll(params?: {
    limit?: number;
    startAfter?: string;
    status?: string;
    userId?: string;
    userType?: string;
    category?: string;
  }, signal?: AbortSignal) {
    return request<{ success: boolean; data: SupportTicket[] }>({
      method: "GET",
      path: "/api/support",
      query: params,
      signal,
    });
  },

  // Get support ticket by ID
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: SupportTicket }>({
      method: "GET",
      path: `/api/support/${enc(id)}`,
      signal,
    });
  },

  // Get support tickets by user ID
  getByUserId(userId: string, params?: { status?: string; limit?: number }, signal?: AbortSignal) {
    return request<{ success: boolean; data: SupportTicket[]; count: number }>({
      method: "GET",
      path: `/api/support/user/${enc(userId)}`,
      query: params,
      signal,
    });
  },

  // Get support tickets by status
  getByStatus(status: string, params?: { limit?: number }, signal?: AbortSignal) {
    return request<{ success: boolean; data: SupportTicket[]; count: number }>({
      method: "GET",
      path: `/api/support/status/${enc(status)}`,
      query: params,
      signal,
    });
  },

  // Update entire support ticket
  update(id: string, body: UpdateSupportTicket, signal?: AbortSignal) {
    return request<{ success: boolean; data: SupportTicket; message: string }>({
      method: "PUT",
      path: `/api/support/${enc(id)}`,
      body,
      signal,
    });
  },

  // Update support ticket status
  updateStatus(id: string, status: SupportTicket['status'], signal?: AbortSignal) {
    return request<{ success: boolean; data: SupportTicket; message: string }>({
      method: "PATCH",
      path: `/api/support/${enc(id)}/status`,
      body: { status },
      signal,
    });
  },

  // Add answer to support ticket
  addAnswer(id: string, body: AddSupportAnswer, signal?: AbortSignal) {
    return request<{ success: boolean; data: SupportTicket; message: string }>({
      method: "POST",
      path: `/api/support/${enc(id)}/answer`,
      body,
      signal,
    });
  },

  // Delete support ticket
  remove(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; message: string }>({
      method: "DELETE",
      path: `/api/support/${enc(id)}`,
      signal,
    });
  },

  // Delete all support tickets (dangerous operation)
  removeAll(signal?: AbortSignal) {
    return request<{ success: boolean; deleted: number }>({
      method: "DELETE",
      path: "/api/support",
      signal,
    });
  },
};

/* --------------------------- Delete Requests ------------------------------ */

export type DeleteRequest = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  adminNotes: string | null;
  requestedAt: string | { _seconds: number; _nanoseconds: number };
  reviewedAt: string | { _seconds: number; _nanoseconds: number } | null;
  reviewedBy: string | null;
};

export type CreateDeleteRequest = Omit<DeleteRequest, 'id' | 'requestedAt' | 'reviewedAt' | 'reviewedBy'>;
export type UpdateDeleteRequest = Partial<Omit<DeleteRequest, 'id' | 'requestedAt'>>;
export type ReviewDeleteRequest = {
  status: 'approved' | 'rejected';
  adminNotes?: string;
  reviewedBy?: string;
};

export const DeleteRequestsAPI = {
  // Create new delete request
  create(body: CreateDeleteRequest, signal?: AbortSignal) {
    return request<{ success: boolean; data: DeleteRequest }>({
      method: "POST",
      path: API_CONFIG.ENDPOINTS.DELETE_REQUESTS,
      body,
      signal,
    });
  },

  // Get all delete requests with pagination and filters
  getAll(params?: {
    limit?: number;
    startAfter?: string;
    status?: string;
  }, signal?: AbortSignal) {
    return request<{ success: boolean; data: DeleteRequest[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.DELETE_REQUESTS,
      query: params,
      signal,
    });
  },

  // Get delete request by ID
  getById(id: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: DeleteRequest }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.DELETE_REQUEST_BY_ID(enc(id)),
      signal,
    });
  },

  // Get delete requests by user ID
  getByUserId(userId: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: DeleteRequest[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.DELETE_REQUESTS_BY_USER(enc(userId)),
      signal,
    });
  },

  // Get delete requests by status
  getByStatus(status: string, signal?: AbortSignal) {
    return request<{ success: boolean; data: DeleteRequest[] }>({
      method: "GET",
      path: API_CONFIG.ENDPOINTS.DELETE_REQUESTS_BY_STATUS(enc(status)),
      signal,
    });
  },

  // Update delete request
  update(id: string, body: UpdateDeleteRequest, signal?: AbortSignal) {
    return request<{ success: boolean; data: DeleteRequest }>({
      method: "PUT",
      path: API_CONFIG.ENDPOINTS.DELETE_REQUEST_BY_ID(enc(id)),
      body,
      signal,
    });
  },

  // Review (approve/reject) delete request
  review(id: string, body: ReviewDeleteRequest, signal?: AbortSignal) {
    return request<{ success: boolean; data: DeleteRequest }>({
      method: "PATCH",
      path: API_CONFIG.ENDPOINTS.DELETE_REQUEST_REVIEW(enc(id)),
      body,
      signal,
    });
  },

  // Delete delete request
  remove(id: string, signal?: AbortSignal) {
    return request<{ success: boolean }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.DELETE_REQUEST_BY_ID(enc(id)),
      signal,
    });
  },

  // Delete all delete requests (dangerous operation)
  removeAll(signal?: AbortSignal) {
    return request<{ success: boolean; deleted: number }>({
      method: "DELETE",
      path: API_CONFIG.ENDPOINTS.DELETE_REQUESTS,
      signal,
    });
  },
};

/* ------------------------------ Convenience ------------------------------- */

import { useEffect, useMemo as useReactMemo } from "react";

/** Abort controller hook to safely cancel in-flight requests on unmount */
export function useApiAbortController() {
  const ac = useReactMemo(() => new AbortController(), []);
  useEffect(() => () => ac.abort(), [ac]);
  return ac;
}

export default API_CONFIG;

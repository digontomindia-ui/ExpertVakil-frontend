// src/services/api.tsx
import axios from "axios";


// ==================== TYPES ====================


// Client Types
export interface Client {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profilePic?: string;
  createdAt: string;
  updatedAt: string;
}


export interface ClientInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
  profilePic?: string;
}


export interface ClientLogin {
  email: string;
  password: string;
}


export interface ClientUpdate {
  name?: string;
  phone?: string;
  email?: string;
}


// User Types
export interface User {
  id: string;
  fullName: string;
  email: string;
  userType: 'individual' | 'firm';
  profilePic?: string;
  reviewSum?: number;
  yearsOfExperience?: number;
  courts?: string[];
  specializations?: string[];
  isVerify?: boolean;
  createdAt?: any;
  updatedAt?: string;
  loginType?: string;
  fcmToken?: string;
  countryCode?: string;
  phoneNumber?: string;
  walletAmount?: string;
  isActive?: boolean;
  travelPreference?: string | null;
  reviewCount?: string;
  bio?: string;
  city?: string;
  completeAddress?: string;
  isAddressPublic?: boolean;
  languages?: string[];
  gender?: string;
  services?: string[];
  isOnline?: boolean;
  lastSeen?: any;
}


export interface UserInput {
  fullName: string;
  email: string;
  password: string;
  userType: 'individual' | 'firm';
  profilePic?: string;
  yearsOfExperience?: number;
  courts?: string[];
  specializations?: string[];
}


export interface UserUpdate {
  fullName?: string;
  email?: string;
  profilePic?: string;
  yearsOfExperience?: number;
  courts?: string[];
  specializations?: string[];
  isVerify?: boolean;
}




// Rating & Review Types (Combined)
export interface RatingReview {
  id: string;
  rating: number | null; // 1-5 stars (optional)
  review: string; // review text (optional, but at least one of rating/review required)
  userId: string; // who is being rated/reviewed
  clientId: string; // who gave the rating/review
  clientName?: string; // name of the client who gave the rating/review
  createdAt: any;
  updatedAt: any;
}

export interface RatingReviewInput {
  rating?: number; // optional: 1-5 stars
  review?: string; // optional: review text (but at least one required)
  userId: string;
  clientId: string;
  clientName?: string; // optional: name of the client
}

export interface RatingReviewStats {
  averageRating: number;
  ratingCount: number;
  reviewCount: number;
  userId: string;
  reviews: RatingReview[];
}

// Blog Types
export interface Blog {
  id: string;
  title: string;
  category: string;
  subtitle: string;
  description: string;
  image: string;
  createdAt: any; // Firestore Timestamp
  published: boolean;
}

// News Types
export interface NewsPost {
  id: string;
  title: string;
  imageUrl: string;
  description: string;
  brief: string;
  source: string;
  liveLink: string;
  category: string;
  createdAt: any;
  updatedAt: any;
  views: number;
  isTrending: boolean;
  published: boolean;
}

export interface NewsInput {
  title: string;
  imageUrl: string;
  description: string;
  brief: string;
  source: string;
  liveLink: string;
  category: string;
  isTrending?: boolean;
  published?: boolean;
}

export interface BlogInput {
  title: string;
  category: string;
  subtitle?: string;
  description: string;
  image?: string;
  published?: boolean;
}

export interface BlogUpdate {
  title?: string;
  category?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  published?: boolean;
}

// Query Answer Types
export interface QueryAnswer {
  id: string;
  queryId: string;
  userId: string;
  userType: 'CLIENT' | 'LAWYER' | 'ADMIN' | 'SUBADMIN';
  userName: string;
  answer: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface QueryAnswerInput {
  queryId: string;
  userId: string;
  userType: 'CLIENT' | 'LAWYER' | 'ADMIN' | 'SUBADMIN';
  userName: string;
  answer: string;
}

export interface QueryAnswerUpdate {
  queryId?: string;
  userId?: string;
  userType?: 'CLIENT' | 'LAWYER' | 'ADMIN' | 'SUBADMIN';
  userName?: string;
  answer?: string;
}

// Support Types
export interface Support {
  id: string;
  userId: string;
  userType: 'CLIENT' | 'LAWYER' | 'ADMIN' | 'SUBADMIN';
  purpose: string;
  category: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  answers: string[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface SupportInput {
  userId: string;
  userType: 'CLIENT' | 'LAWYER' | 'ADMIN' | 'SUBADMIN';
  purpose: string;
  category: string;
  title: string;
  description: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  answers?: string[];
}

export interface SupportUpdate {
  userId?: string;
  userType?: 'CLIENT' | 'LAWYER' | 'ADMIN' | 'SUBADMIN';
  purpose?: string;
  category?: string;
  title?: string;
  description?: string;
  status?: 'PENDING' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  answers?: string[];
}

// Query Types
export interface Query {
  id: string;
  title: string;
  description: string;
  askedByName: string;
  askedById: string;
  answersCount: number;
  source: string;
  createdAt: any; // Firestore Timestamp
}


export interface QueryInput {
  title: string;
  description: string;
  askedByName: string;
  askedById: string;
  answersCount?: number;
  source?: string;
}


export interface QueryUpdate {
  title?: string;
  description?: string;
  askedByName?: string;
  askedById?: string;
  answersCount?: number;
  source?: string;
}


// Response Types
export interface AuthResponse {
  success: boolean;
  data: Client;
  token: string;
  firebaseToken: string;
}


export interface UserAuthResponse {
  token: string;
  user: User;
  message: string;
}


export interface ProfileResponse {
  user: Client | User;
  message: string;
}


export interface ListResponse<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
}


export interface DeleteResponse {
  message: string;
  deletedId: string;
}


export interface BulkDeleteResponse {
  message: string;
  deletedCount: number;
}


export interface SuccessResponse {
  message: string;
}


export interface ErrorResponse {
  error: string;
  message: string;
}




// ==================== API INSTANCE ====================

// Environment configuration
const getBaseURL = () => {
  return "https://api.legalnetwork.in";
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: true, // Always send cookies for auth
});

// Add fallback mechanism for localhost failures
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If localhost fails and we haven't already tried production
    if (
      error.response?.status >= 500 ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ERR_NETWORK'
    ) {
      const currentBaseURL = api.defaults.baseURL;

      // If currently using localhost, try production as fallback
      if (currentBaseURL?.includes('localhost:4000') && !originalRequest._retry) {
        console.warn('Localhost server not responding, switching to production backend...');

        // Update base URL to production
        api.defaults.baseURL = "https://api.legalnetwork.in";
        originalRequest._retry = true;

        // Retry the request with production URL
        return api(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);



// No interceptors needed for cookie-based auth


// ==================== CLIENT API ====================


export const clientAPI = {
  // Register a new client
  register: (data: ClientInput): Promise<{ data: AuthResponse }> =>
    api.post("/api/clients", data),


  // Get all clients
  getAll: (): Promise<{ data: ListResponse<Client> }> =>
    api.get("/api/clients"),


  // Delete all clients
  deleteAll: (): Promise<{ data: BulkDeleteResponse }> =>
    api.delete("/api/clients"),


  // Authenticate a client
  login: (data: ClientLogin): Promise<{ data: AuthResponse }> =>
    api.post("/api/clients/login", data),


  // Logout client
  logout: (): Promise<{ data: SuccessResponse }> =>
    api.post("/api/clients/logout"),


  // Get current client profile (requires authentication)
  getProfile: (): Promise<{ data: ProfileResponse }> =>
    api.get("/api/clients/me"),


  // Verify if user is authenticated (has valid token/session)
  verifyAuth: async (): Promise<{ authenticated: boolean; user?: any }> => {
    try {
      const res = await api.get("/api/clients/me");
      const userData = res.data.data || res.data;

      // Check if user data has valid ID
      if (userData && (userData.id || userData._id)) {
        return { authenticated: true, user: userData };
      }

      return { authenticated: false };
    } catch (error) {
      return { authenticated: false };
    }
  },


  // Get client by ID
  getById: (id: string): Promise<{ data: Client }> =>
    api.get(`/api/clients/${id}`),


  // Update client
  update: (id: string, data: ClientUpdate): Promise<{ data: Client }> =>
    api.put(`/api/clients/${id}`, data),


  // Delete client
  delete: (id: string): Promise<{ data: DeleteResponse }> =>
    api.delete(`/api/clients/${id}`),
};


// ==================== USER API ====================


export const userAPI = {
  // Create a new user
  create: (data: UserInput): Promise<{ data: UserAuthResponse }> =>
    api.post("/api/users", data),


  // Get all users
  getAll: (params?: Record<string, string>): Promise<{ data: ListResponse<User> }> =>
    api.get("/api/users", { params }),


  // Delete all users
  deleteAll: (): Promise<{ data: BulkDeleteResponse }> =>
    api.delete("/api/users"),


  // Get user by ID
  getById: (id: string): Promise<{ data: { success: boolean; data: User } }> =>
    api.get(`/api/users/${id}`),


  // Update user
  update: (id: string, data: UserUpdate): Promise<{ data: User }> =>
    api.put(`/api/users/${id}`, data),


  // Delete user
  delete: (id: string): Promise<{ data: DeleteResponse }> =>
    api.delete(`/api/users/${id}`),
};




// ==================== BLOG API ====================


export const blogAPI = {
  // Create a new blog post
  create: (data: BlogInput): Promise<{ data: { success: boolean; data: Blog } }> =>
    api.post("/api/blogs", data),

  // Get all blog posts with pagination and filtering
  getAll: (params?: { limit?: number; startAfter?: string; category?: string; published?: boolean }): Promise<{ data: { success: boolean; data: Blog[] } }> =>
    api.get("/api/blogs", { params }),

  // Get blog post by ID
  getById: (id: string): Promise<{ data: { success: boolean; data: Blog } }> =>
    api.get(`/api/blogs/${id}`),

  // Update blog post
  update: (id: string, data: BlogUpdate): Promise<{ data: { success: boolean; data: Blog } }> =>
    api.put(`/api/blogs/${id}`, data),

  // Delete blog post
  delete: (id: string): Promise<{ data: { success: boolean } }> =>
    api.delete(`/api/blogs/${id}`),

  // Delete all blog posts (dangerous operation)
  deleteAll: (): Promise<{ data: { success: boolean; deleted: number } }> =>
    api.delete("/api/blogs"),
};

// ==================== QUERY ANSWER API ====================


export const queryAnswerAPI = {
  // Create a new query answer
  create: (data: QueryAnswerInput): Promise<{ data: { success: boolean; data: QueryAnswer; message: string } }> =>
    api.post("/api/query-answers", data),

  // Get all query answers with pagination and filtering
  getAll: (params?: { limit?: number; startAfter?: string; queryId?: string; userId?: string; userType?: string }): Promise<{ data: { success: boolean; data: QueryAnswer[] } }> =>
    api.get("/api/query-answers", { params }),

  // Get query answers for a specific query
  getByQueryId: (queryId: string, params?: { limit?: number }): Promise<{ data: { success: boolean; data: QueryAnswer[]; count: number } }> =>
    api.get(`/api/query-answers/query/${queryId}`, { params }),

  // Get query answers by a specific user
  getByUserId: (userId: string, params?: { limit?: number }): Promise<{ data: { success: boolean; data: QueryAnswer[]; count: number } }> =>
    api.get(`/api/query-answers/user/${userId}`, { params }),

  // Get query answer by ID
  getById: (id: string): Promise<{ data: { success: boolean; data: QueryAnswer } }> =>
    api.get(`/api/query-answers/${id}`),

  // Update query answer
  update: (id: string, data: QueryAnswerUpdate): Promise<{ data: { success: boolean; data: QueryAnswer; message: string } }> =>
    api.put(`/api/query-answers/${id}`, data),

  // Delete query answer
  delete: (id: string): Promise<{ data: { success: boolean; message: string } }> =>
    api.delete(`/api/query-answers/${id}`),
};

// ==================== SUPPORT API ====================


export const supportAPI = {
  // Create a new support ticket
  create: (data: SupportInput): Promise<{ data: { success: boolean; data: Support; message: string } }> =>
    api.post("/api/support", data),

  // Get all support tickets with pagination and filtering
  getAll: (params?: { limit?: number; startAfter?: string; status?: string; userId?: string; userType?: string; category?: string }): Promise<{ data: { success: boolean; data: Support[] } }> =>
    api.get("/api/support", { params }),

  // Get support ticket by ID
  getById: (id: string): Promise<{ data: { success: boolean; data: Support } }> =>
    api.get(`/api/support/${id}`),

  // Get support tickets by user ID
  getByUserId: (userId: string, params?: { status?: string; limit?: number }): Promise<{ data: { success: boolean; data: Support[]; count: number } }> =>
    api.get(`/api/support/user/${userId}`, { params }),

  // Get support tickets by status
  getByStatus: (status: string, params?: { limit?: number }): Promise<{ data: { success: boolean; data: Support[]; count: number } }> =>
    api.get(`/api/support/status/${status}`, { params }),

  // Update support ticket
  update: (id: string, data: SupportUpdate): Promise<{ data: { success: boolean; data: Support; message: string } }> =>
    api.put(`/api/support/${id}`, data),

  // Delete support ticket
  delete: (id: string): Promise<{ data: { success: boolean; message: string } }> =>
    api.delete(`/api/support/${id}`),

  // Delete all support tickets (dangerous operation)
  deleteAll: (): Promise<{ data: { success: boolean; deleted: number } }> =>
    api.delete("/api/support"),
};

// ==================== QUERY API ====================


export const queryAPI = {
  // Submit a legal query
  create: (data: QueryInput): Promise<{ data: { success: boolean; data: Query } }> =>
    api.post("/api/queries", data),

  // Get all queries with pagination support
  getAll: (params?: { limit?: number; startAfter?: string }): Promise<{ data: { success: boolean; data: Query[] } }> =>
    api.get("/api/queries", { params }),

  // Delete all queries (dangerous operation)
  deleteAll: (): Promise<{ data: { success: boolean; deleted: number } }> =>
    api.delete("/api/queries"),

  // Get queries by user
  getByUser: (userId: string): Promise<{ data: { success: boolean; data: Query[] } }> =>
    api.get(`/api/queries/user/${userId}`),

  // Get query by ID
  getById: (id: string): Promise<{ data: { success: boolean; data: Query } }> =>
    api.get(`/api/queries/${id}`),

  // Update query (full replacement)
  update: (id: string, data: QueryUpdate): Promise<{ data: { success: boolean; data: Query } }> =>
    api.put(`/api/queries/${id}`, data),

  // Delete query
  delete: (id: string): Promise<{ data: { success: boolean } }> =>
    api.delete(`/api/queries/${id}`),
};


// ==================== RATING & REVIEW API (Combined) ====================


export const ratingReviewAPI = {
  // Create a rating and/or review
  create: (data: RatingReviewInput): Promise<{ data: RatingReview }> =>
    api.post("/api/ratings-reviews", data),

  // Get ratings/reviews by user ID
  getByUserId: (userId: string): Promise<{ data: RatingReview[] }> =>
    api.get(`/api/ratings-reviews/user/${userId}`),

  // Get rating/review stats for user
  getStats: (userId: string): Promise<{ data: { success: boolean, data: RatingReviewStats } }> =>
    api.get(`/api/ratings-reviews/user/${userId}/stats`),

  // Get rating/review by ID
  getById: (id: string): Promise<{ data: RatingReview }> =>
    api.get(`/api/ratings-reviews/${id}`),

  // Update rating/review
  update: (id: string, data: Partial<RatingReviewInput>): Promise<{ data: RatingReview }> =>
    api.put(`/api/ratings-reviews/${id}`, data),

  // Delete rating/review
  delete: (id: string): Promise<{ data: DeleteResponse }> =>
    api.delete(`/api/ratings-reviews/${id}`),
};

// ==================== CLIENT CONTACT API ====================

// Client Contact Types
export interface ClientContact {
  id: string;
  clientId: string;
  lawyerId: string;
  contactType: 'chat' | 'call' | 'email' | 'inquiry';
  status: 'initiated' | 'responded' | 'completed' | 'cancelled';
  conversationId?: string;
  contactDate: string;
  lastActivity: string;
  notes?: string;
}

export interface ClientContactInput {
  clientId: string;
  lawyerId: string;
  contactType?: 'chat' | 'call' | 'email' | 'inquiry';
  conversationId?: string;
  notes?: string;
}

export const clientContactAPI = {
  // Create client contact record
  create: (data: ClientContactInput): Promise<{ data: ClientContact }> =>
    api.post("/api/client-contacts", data),

  // Get client contact by ID
  getById: (id: string): Promise<{ data: ClientContact }> =>
    api.get(`/api/client-contacts/${id}`),

  // Get contacts by client ID
  getByClientId: (clientId: string): Promise<{ data: ClientContact[] }> =>
    api.get(`/api/client-contacts/client/${clientId}`),

  // Get contacts by lawyer ID
  getByLawyerId: (lawyerId: string): Promise<{ data: ClientContact[] }> =>
    api.get(`/api/client-contacts/lawyer/${lawyerId}`),

  // Get contact by conversation ID
  getByConversationId: (conversationId: string): Promise<{ data: ClientContact }> =>
    api.get(`/api/client-contacts/conversation/${conversationId}`),

  // Update contact status
  updateStatus: (id: string, status: string): Promise<{ data: ClientContact }> =>
    api.put(`/api/client-contacts/${id}/status`, { status }),

  // Update contact details
  update: (id: string, data: Partial<ClientContactInput>): Promise<{ data: ClientContact }> =>
    api.put(`/api/client-contacts/${id}`, data),
};

// ==================== UNAUTHENTICATED API INSTANCE ====================

// Create an unauthenticated axios instance for public data
const publicApi = axios.create({
  baseURL: getBaseURL(),
  // Don't send credentials for public requests
});

// Add the same fallback mechanism to publicApi
publicApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If localhost fails and we haven't already tried production
    if (
      error.response?.status >= 500 ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ERR_NETWORK' ||
      error.code === 'ERR_CONNECTION_REFUSED' ||
      error.message?.includes('ERR_CONNECTION_REFUSED') ||
      error.message?.includes('ECONNREFUSED')
    ) {
      const currentBaseURL = publicApi.defaults.baseURL;

      // If currently using localhost, try production as fallback
      if (currentBaseURL?.includes('localhost:4000') && !originalRequest._retry) {
        console.warn('Public API: Localhost server not responding, switching to production backend...');

        // Update base URL to production
        publicApi.defaults.baseURL = "https://legal-backend-seven.vercel.app";
        originalRequest._retry = true;

        // Retry the request with production URL
        return publicApi(originalRequest);
      }
    }

    return Promise.reject(error);
  }
);

// ==================== PUBLIC API METHODS ====================

export const publicUserAPI = {
  // Get all users (public access)
  getAll: (params?: Record<string, string>): Promise<{ data: ListResponse<User> }> =>
    publicApi.get("/api/users", { params }),
};

export const publicBlogAPI = {
  // Get all blog posts (public access)
  getAll: (params?: { limit?: number; startAfter?: string; category?: string; published?: boolean }): Promise<{ data: { success: boolean; data: Blog[] } }> =>
    publicApi.get("/api/blogs", { params }),

  // Get blog post by ID (public access)
  getById: (id: string): Promise<{ data: { success: boolean; data: Blog } }> =>
    publicApi.get(`/api/blogs/${id}`),
};

// ==================== EXPORT DEFAULT API INSTANCE ====================

export const publicQueryAPI = {
  // Get all queries (public access)
  getAll: (params?: { limit?: number; startAfter?: string }): Promise<{ data: { success: boolean; data: Query[] } }> =>
    publicApi.get("/api/queries", { params }),
};

export const publicQueryAnswerAPI = {
  // Get query answers for a specific query (public access)
  getByQueryId: (queryId: string, params?: { limit?: number }): Promise<{ data: { success: boolean; data: QueryAnswer[]; count: number } }> =>
    publicApi.get(`/api/query-answers/query/${queryId}`, { params }),
};

// ==================== SERVICE TYPES ====================

export interface Service {
  id: string;
  name: string;
  description: string;
  image?: string;
  categories: string[];
  number: string;
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

export interface ServiceBookedInput {
  clientId: string;
  phoneNumber: string;
  title: string;
  description: string;
  servicesBooked: string[];
}

export interface ServiceBooked {
  id: string;
  clientId: string;
  phoneNumber: string;
  title: string;
  description: string;
  servicesBooked: string[];
  createdAt: any; // Firestore Timestamp
  updatedAt: any; // Firestore Timestamp
}

// ==================== SERVICE API ====================

export const serviceAPI = {
  // Get all services
  getAll: (params?: { limit?: number }): Promise<{ data: { success: boolean; data: Service[] } }> =>
    api.get("/api/services", { params }),

  // Get service by ID
  getById: (id: string): Promise<{ data: { success: boolean; data: Service } }> =>
    api.get(`/api/services/${id}`),
};

// ==================== CHALLAN API ====================

export const challanAPI = {
  // Main search endpoint
  search: (rcNumber: string, email: string, phone: string) =>
    api.post("/api/challan/search", { rcNumber, email, phone }),
};

// ==================== SERVICE BOOKED API ====================

export const serviceBookedAPI = {
  // Create a new service booking
  create: (data: ServiceBookedInput): Promise<{ data: { success: boolean; data: ServiceBooked } }> =>
    api.post("/api/services-booked", data),

  // Get service bookings by client ID
  getByClientId: (clientId: string): Promise<{ data: { success: boolean; data: ServiceBooked[] } }> =>
    api.get(`/api/services-booked/client/${clientId}`),
};

// ==================== CATEGORY TYPES ====================

export interface Category {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// ==================== CATEGORY API ====================

export const categoriesAPI = {
  // Get all active categories
  getAll: (params?: { isActive?: boolean }): Promise<{ data: { success: boolean; data: Category[] } }> =>
    api.get("/api/categories", { params }),

  // Get category by ID
  getById: (id: string): Promise<{ data: { success: boolean; data: Category } }> =>
    api.get(`/api/categories/${id}`),
};

// ==================== NEWS API ====================

export const newsAPI = {
  // Create a new news post
  create: (data: NewsInput): Promise<{ data: { success: boolean; data: NewsPost } }> =>
    api.post("/api/news", data),

  // Get all news posts
  getAll: (params?: any): Promise<{ data: { success: boolean; data: NewsPost[] } }> =>
    api.get("/api/news", { params }),

  // Get news post by ID
  getById: (id: string): Promise<{ data: { success: boolean; data: NewsPost } }> =>
    api.get(`/api/news/${id}`),

  // Update news post
  update: (id: string, data: Partial<NewsInput>): Promise<{ data: { success: boolean; data: NewsPost } }> =>
    api.put(`/api/news/${id}`, data),

  // Delete news post
  delete: (id: string): Promise<{ data: { success: boolean } }> =>
    api.delete(`/api/news/${id}`),

  // Increment views
  incrementViews: (id: string): Promise<{ data: { success: boolean; data: NewsPost } }> =>
    api.post(`/api/news/${id}/views/increment`),
};

export default api;


// src/services/api-examples.ts
// Example usage of the API services

import { clientAPI, userAPI, queryAPI } from './api';
import type { ClientInput, UserInput, QueryInput } from './api';

// ==================== CLIENT API EXAMPLES ====================

export const clientExamples = {
  // Register a new client
  async registerClient() {
    try {
      const clientData: ClientInput = {
        email: "john@example.com",
        password: "password123",
        name: "John Doe",
        phone: "+1234567890"
      };
      
      const response = await clientAPI.register(clientData);
      console.log("Client registered:", response.data);
      return response.data;
    } catch (error) {
      console.error("Registration failed:", error);
    }
  },

  // Login client
  async loginClient() {
    try {
      const loginData = {
        email: "john@example.com",
        password: "password123"
      };
      
      const response = await clientAPI.login(loginData);
      console.log("Login successful:", response.data);
      
      // Store token in localStorage
      localStorage.setItem("token", response.data.token);
      return response.data;
    } catch (error) {
      console.error("Login failed:", error);
    }
  },

  // Get current client profile
  async getClientProfile() {
    try {
      const response = await clientAPI.getProfile();
      console.log("Client profile:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to get profile:", error);
    }
  },

  // Get all clients
  async getAllClients() {
    try {
      const response = await clientAPI.getAll();
      console.log("All clients:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to get clients:", error);
    }
  }
};

// ==================== USER API EXAMPLES ====================

export const userExamples = {
  // Create a new user (lawyer/firm)
  async createUser() {
    try {
      const userData: UserInput = {
        fullName: "Jane Smith",
        email: "jane@lawfirm.com",
        password: "password123",
        userType: "individual",
        yearsOfExperience: 5,
        courts: ["Supreme Court", "High Court"],
        specializations: ["Criminal Law", "Family Law"]
      };
      
      const response = await userAPI.create(userData);
      console.log("User created:", response.data);
      return response.data;
    } catch (error) {
      console.error("User creation failed:", error);
    }
  },

  // Get all users (lawyers/firms)
  async getAllUsers() {
    try {
      const response = await userAPI.getAll();
      console.log("All users:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to get users:", error);
    }
  },

  // Update user profile
  async updateUser(userId: string) {
    try {
      const updateData = {
        fullName: "Jane Smith Updated",
        specializations: ["Criminal Law", "Family Law", "Corporate Law"]
      };
      
      const response = await userAPI.update(userId, updateData);
      console.log("User updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("User update failed:", error);
    }
  }
};


// ==================== QUERY API EXAMPLES ====================

export const queryExamples = {
  // Submit a legal query
  async submitQuery() {
    try {
      const queryData: QueryInput = {
        title: "Property Dispute Question",
        description: "I have a property dispute with my neighbor regarding boundary lines...",
        askedByName: "John Doe",
        askedById: "user-id-here",
        answersCount: 0,
        source: "community"
      };
      
      const response = await queryAPI.create(queryData);
      console.log("Query submitted:", response.data);
      return response.data;
    } catch (error) {
      console.error("Query submission failed:", error);
    }
  },

  // Get all queries
  async getAllQueries() {
    try {
      const response = await queryAPI.getAll();
      console.log("All queries:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to get queries:", error);
    }
  },

  // Get queries by user
  async getQueriesByUser(userId: string) {
    try {
      const response = await queryAPI.getByUser(userId);
      console.log("User queries:", response.data);
      return response.data;
    } catch (error) {
      console.error("Failed to get user queries:", error);
    }
  },

  // Update query answers count
  async updateQueryAnswers(queryId: string) {
    try {
      const updateData = {
        answersCount: 5,
        description: "Updated query description..."
      };
      
      const response = await queryAPI.update(queryId, updateData);
      console.log("Query updated:", response.data);
      return response.data;
    } catch (error) {
      console.error("Query update failed:", error);
    }
  }
};

// ==================== USAGE IN COMPONENTS ====================

/*
// Example usage in a React component:

import { clientAPI, userAPI } from '../services/api';

const MyComponent = () => {
  const handleLogin = async () => {
    try {
      const response = await clientAPI.login({
        email: "user@example.com",
        password: "password123"
      });
      
      localStorage.setItem("token", response.data.token);
      // Redirect to dashboard or update UI
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  const handleGetUsers = async () => {
    try {
      const response = await userAPI.getAll();
      console.log("Users:", response.data.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  return (
    <div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleGetUsers}>Get Users</button>
    </div>
  );
};
*/

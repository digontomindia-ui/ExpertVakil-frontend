// src/services/api/challanAPI.ts
import api from "./api";

export const challanAPI = {
  // Main search endpoint - unlimited searches
  search: (rcNumber: string, userId?: string) =>
    api.post("/api/challan/search", { rcNumber, userId }),
};

import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API || "http://localhost:8000",
});

export const getProducts = () => API.get("/products");
export const getInventory = (productId) => API.get(`/inventory?product_id=${productId}`);

export const purchaseProduct = (user_id, product_id) =>
  API.post("/purchase", { user_id, product_id });

export const getOrders = () => API.get("/orders");
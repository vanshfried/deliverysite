import API from "./api";

// fetch products
export const getStoreProducts = () => API.get("/store-owner/store-products");

// delete product
export const deleteProduct = (id) => 
  API.delete(`/store-owner/store-products/delete/${id}`);

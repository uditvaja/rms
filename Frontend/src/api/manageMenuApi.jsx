// manageMenuApi.js
import axiosInstance, { endpoints } from '../axios';

// Fetch all orders
export const fetchOrders = async () => {
  try {
    const response = await axiosInstance.get(endpoints.order.getPlacedOrder);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Accept an order
export const acceptOrder = async (orderId) => {
  try {
    const response = await axiosInstance.patch(`${endpoints.order.acceptOrder}/${orderId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Fetch admin data
export const fetchAdminData = async (token) => {
  try {
    const response = await axiosInstance.get(endpoints.auth.getAdmin, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Get admin data
export const getAdminData = async (token) => {
  try {
    const response = await axiosInstance.get(endpoints.auth.getAdmin, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

// Existing functions...
export const fetchCategories = async () => {
  try {
    const response = await axiosInstance.get('/category/');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const addCategory = async (formData) => {
  try {
    const response = await axiosInstance.post('/category/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchItems = async () => {
  try {
    const response = await axiosInstance.get('/product/getAllItems');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const updateItem = async (itemId, updatedItem) => {
  try {
    const response = await axiosInstance.put(`/product/editItem/${itemId}`, updatedItem);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const deleteItem = async (itemId) => {
  try {
    const response = await axiosInstance.delete(`/product/deleteItem/${itemId}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const cashPayment = async (userId ) => {
  try {
    const response = await axiosInstance.post('/place-order/accept-cash-payment', {
      userId : userId , // Pass the orderId in the request body
    });
    console.log("Fetching Data:", response);
    return response.data;
  } catch (error) {
    console.error('Error processing cash payment:', error);
    throw error;
  }
};

export const declineCashPayment = async (userId ) => {
  try {
    const response = await axiosInstance.post('/place-order/decline-cash-payment', {
      userId : userId , // Pass the orderId in the request body
    });
    return response.data;
  } catch (error) {
    console.error('Error declining cash payment:', error);
    throw error;
  }
};

export const fetchParcelPaymentHistory = async () => {
  try {
    const response = await axiosInstance.get('/place-order/payment-history/parcel');
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchOnsitePaymentHistory = async () => {
  try {
    const response = await axiosInstance.get('/place-order/payment-history/onsite');
    return response.data;
  } catch (error) {
    throw error;
  }
};
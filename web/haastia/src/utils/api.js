import axios from "axios";
import { getValidToken } from "./auth";

const normalizeErrorMessage = (error) => {
  if (!error) {
    return "An unexpected error occurred.";
  }

  const responseData = error.response?.data;

  if (typeof responseData === "string" && responseData.trim().length > 0) {
    return responseData;
  }

  if (responseData && typeof responseData === "object") {
    if (typeof responseData.message === "string" && responseData.message.trim().length > 0) {
      return responseData.message;
    }
    if (typeof responseData.error === "string" && responseData.error.trim().length > 0) {
      return responseData.error;
    }
  }

  if (typeof error.message === "string" && error.message.trim().length > 0) {
    return error.message;
  }

  return "An unexpected error occurred.";
};

export const authorizedRequest = async ({ url, method = "get", data, params, headers = {} }) => {
  const auth = getValidToken();

  if (!auth?.token) {
    throw new Error("Your session has expired. Please log in again.");
  }

  try {
    const response = await axios({
      method,
      url,
      data,
      params,
      headers: {
        Authorization: `Bearer ${auth.token}`,
        ...headers,
      },
    });

    return response.data;
  } catch (err) {
    throw new Error(normalizeErrorMessage(err));
  }
};

export default authorizedRequest;

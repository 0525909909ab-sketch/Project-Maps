import api from "./client";

export const loginApi = (email, password) => {
  return api.post('/auth/login', { email: email, password: password });
};

export const registerApi = (email, password) => {
  return api.post('/auth/register', { email: email, password: password });
};

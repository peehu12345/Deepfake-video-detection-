import API from "../api";

export const mainServices = {
  uploadAudio(payload) {
    return API.post("/cryptoflow/predict_audio/", payload);
  },
  uploadImage(payload) {
    return API.post("/cryptoflow/predict_image/", payload);
  },
};
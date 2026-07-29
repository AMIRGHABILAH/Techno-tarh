import api from "./axios";

class DesignService {

  chargeSave(designId) {
    return api.post(`/designs/${designId}/charge-save/`);
  }



  // دریافت لیست طراحی‌ها
  async getDesigns(params = {}) {
    const response = await api.get("/designs/", { params });
    return response.data;
  }

  // دریافت یک طراحی
  // async getDesign(id) {
  //   const response = await api.get(`/designs/${id}/`);
  //   return response.data;
  // }
    async getDesign(id) {
    return api.get(`/designs/${id}/`);
  }

  // // ایجاد طراحی
  // async createDesign(payload) {
  //   const response = await api.post("/designs/", payload);
  //   return response.data;
  // }

  //   async createDesign(payload) {
  //   return api.post("/designs/", payload);
  // }

  async createDesign(payload) {
  const response = await api.post("/designs/", payload);
  return response.data;   // 🔥 داده واقعی از سرور
}

  // آپدیت طراحی
  // async updateDesign(id, payload) {
  //   const response = await api.put(`/designs/${id}/`, payload);
  //   return response.data;
  // }
  async updateDesign(id, payload) {
    const response = await api.put(`/designs/${id}/`, payload);
    return response.data;            // ← ضروری
  }


  // حذف طراحی
  async deleteDesign(id) {
    const response = await api.delete(`/designs/${id}/`);
    return response.data;
  }

  // کپی طراحی
  async duplicateDesign(id) {
    const response = await api.post(`/designs/${id}/duplicate/`);
    return response.data;
  }
}

export default new DesignService();

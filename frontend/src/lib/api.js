import axios from 'axios'
export const BASE_URL=import.meta.env.VITE_BACKEND_API_BASE_URL;


//axios ko instance create garera default configuration add gareko for 
//every axios call
const api=axios.create({
    baseURL:BASE_URL,
    withCredentials:true,
})

//interceptor vaneko middeleware jasto ho
// every req ma header add garera pathauxa yesle
api.interceptors.request.use(
    (config)=>{
        const token=localStorage.getItem('token')
        if(token){
            config.headers=config.headers || {};
            config.headers.Authorization=`Bearer ${token}`;
        }
        return config
    }
)

let isRefreshing=false;
let pendingQueue=[];

// if access-token expires and at that time multiple req comes then they are placed in queue
// update access token in case of expiry
const resolveQueue=(token,error)=>{
pendingQueue.forEach(({reject,resolve})=>{
    if(error) reject(error)
        else resolve(token)
})
pendingQueue=[];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthRoute = originalRequest?.url?.includes("/api/auth/");

    if (status === 401 && originalRequest && !originalRequest._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then((newToken) => {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await axios.post(
          `${BASE_URL}/api/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = res.data.access_token;
        localStorage.setItem("token", newToken);
        resolveQueue(newToken, null);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        resolveQueue(null, refreshError);
        localStorage.removeItem("token");
        if (typeof window !== "undefined") {
          window.location.href = "/";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;





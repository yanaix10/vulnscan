const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function request(endpoint, options = {}) {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      let errorDetail = `HTTP ${response.status}: ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          errorDetail = typeof errorData.detail === 'string' 
            ? errorData.detail 
            : JSON.stringify(errorData.detail);
        }
      } catch {
        // Ignore json parse error if response is not json
      }
      throw new Error(errorDetail);
    }

    // Return json if content-type is json, else text
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return await response.json();
    }
    return await response.text();
  } catch (err) {
    console.error(`API Error on [${config.method || "GET"} ${endpoint}]:`, err);
    throw err;
  }
}

export { API_BASE_URL };

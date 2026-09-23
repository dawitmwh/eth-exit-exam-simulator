import axios from 'axios';

const EC2_DOMAIN =
  'ec2-51-20-150-131.eu-north-1.compute.amazonaws.com';

const getBackendUrl = () => {
  const { hostname, protocol } = window.location;

  // Local tenant:
  // universal-college.localhost:5173
  if (hostname.endsWith('.localhost')) {
    const subdomain = hostname.split('.')[0];

  
    return `${protocol}//${subdomain}.localhost:8000/api/`;
  }
  if (hostname.endsWith('localhost')) {
    //no subdomain if root domain

    return `${protocol}//localhost:8000/api/`;
  }

  // EC2 cannot be divided into subdomain, it is justa test DNS system by aws

  // EC2 root:
  // ec2-51-20-150-131.eu-north-1.compute.amazonaws.com
  if (hostname === EC2_DOMAIN) {
      //There is no port on production, it is just on port 80,
    // so we need to account for that in our URL construction.
    return `${protocol}//${EC2_DOMAIN}/api/`;
  }

  if (hostname === 'ethioexitexamprep.xyz') {
    return `${protocol}//ethioexitexamprep.xyz/api/`;
  }

  //EC2 cannot be divided into subdomain, it is justa test DNS system by aws
  // EC2 tenant:
  // universal-college.ec2-51-20-150-131.eu-north-1.compute.amazonaws.com
  // if (hostname.endsWith(`.${EC2_DOMAIN}`)) {
  //   const subdomain = hostname.replace(`.${EC2_DOMAIN}`, '');


  //   //again the web server is accessible on port 80, there is no need to specify it
  //   return `${protocol}//${subdomain}.${EC2_DOMAIN}/api/`;
  // }

  // Fallback
  //the django api endpoint is accessible from regular http port 80
  // return `${protocol}//${EC2_DOMAIN}/api/`;
};

console.log('🌐 Django API URL:', getBackendUrl());

const apiClient = axios.create({
  baseURL: getBackendUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
});

const bypassUrls = [
  'token/',
  'users/register/',
  'tenant/config/',
];

apiClient.interceptors.request.use(
  (config) => {
    const isBypassUrl = bypassUrls.some(
      (url) => config.url?.includes(url)
    );

    const token = localStorage.getItem('access_token');

    if (token && !isBypassUrl) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn(
        'Unauthorized request detected or token expired. Clearing session.'
      );

      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');

      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?expired=true';
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;








// // src/api/client.ts
// import axios from 'axios';

// // const getBackendUrl = () => {
// //   const { hostname, protocol } = window.location;
  
// //   // Local development handling (e.g., aau.localhost:3000 -> aau.localhost:8000)
// //   if (hostname.includes('localhost')) {
// //     const subdomain = hostname.split('.')[0];
// //     return `${protocol}//${subdomain}.localhost:8000/api/`;
// //   }
  
// //   // Production handling (e.g., aau.company.com -> aau.api.company.com)
// //   const parts = hostname.split('.');
// //   if (parts.length > 2) {
// //     const subdomain = parts[0];
// //     const domain = parts.slice(1).join('.');
// //     return `${protocol}//${subdomain}.api.${domain}/api/`;
// //   }

// //   return 'http://127.0.0.1:8000/api/';
// // };

// // const apiClient = axios.create({
// //   baseURL: getBackendUrl(),
// //   headers: {
// //     'Content-Type': 'application/json',
// //   },
// // });

// const getBackendUrl = () => {
//   const { hostname, protocol } = window.location;
  
//   // 1. Get patterns from Environment Variables
//   const urlTemplate = import.meta.env.VITE_API_URL_TEMPLATE || "{subdomain}.localhost:8000/api";
//   const rootApi = import.meta.env.VITE_ROOT_API_URL || "localhost:8000/api";

//   // 2. Identify the Subdomain
//   const parts = hostname.split('.');
  
//   // Check if we are on a subdomain (e.g., 'aau.localhost' or 'aau.exitprep.et')
//   // We ignore 'www', 'localhost', and IP addresses
//   const isSubdomain = parts.length > 1 && !['www', 'localhost', '127'].includes(parts[0]);

//   if (isSubdomain) {
//     const subdomain = parts[0];
//     // Replace the placeholder with the actual subdomain detected in the browser
//     const formattedUrl = urlTemplate.replace('{subdomain}', subdomain);
//     return `${protocol}//${formattedUrl}/`;
//   }

//   // 3. Fallback: If no subdomain (Root Domain), use the Root API path
//   return `${protocol}//${rootApi}/`;
// };

// const apiClient = axios.create({
//   baseURL: getBackendUrl(),
//   headers: {
//     'Content-Type': 'application/json',
//   },
// });
 

// // Paths that MUST NEVER have tokens attached or trigger 401 refresh interceptors
// const bypassUrls = ['token/', 'users/register/', 'tenant/config/'];

// // Outgoing Request Interceptor: Inject Access Token for every single call automatically
// apiClient.interceptors.request.use(
//   (config) => {
//     const isBypassUrl = bypassUrls.some((url) => config.url?.includes(url));
//     const token = localStorage.getItem('access_token');
//     if (token && !isBypassUrl) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Incoming Response Interceptor: Trap expired tokens globally
// apiClient.interceptors.response.use(
//   (response) => response,
//   (error) => {
//     // If the backend returns a 401, the access token is invalid or expired
//     if (error.response && error.response.status === 401) {
//       console.warn("Unauthorized request detected or token expired. Clearing session.");
      
//       // Clear out the stale authentication tokens
//       localStorage.removeItem('access_token');
//       localStorage.removeItem('refresh_token');
//       localStorage.removeItem('user_data');
      
      
//       // Force user back to the login screen cleanly
//       if (!window.location.pathname.includes('/login')) {
//         window.location.href = '/login?expired=true';
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// export default apiClient;
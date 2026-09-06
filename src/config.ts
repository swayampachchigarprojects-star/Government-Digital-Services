const apiBaseUrl = 'http://192.168.0.248:8080';

export const config = {
  apiBaseUrl,
  googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '623498282771-5hm3upo0qrs2qm48aktqu6pan6d1jrqe.apps.googleusercontent.com',
  googleAndroidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID || '623498282771-5hm3upo0qrs2qm48aktqu6pan6d1jrqe.apps.googleusercontent.com',
  googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID || '623498282771-5hm3upo0qrs2qm48aktqu6pan6d1jrqe.apps.googleusercontent.com',
};

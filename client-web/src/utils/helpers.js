export const formatTime = (date) => {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const isImageFile = (url) => {
  return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
};

export const getFileNameFromUrl = (url) => {
  return url.split('/').pop();
};

export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};
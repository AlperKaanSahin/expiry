export const getErrorMessage = (error) => {
  // Backend'den gelen yapılandırılmış hata
  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  // Validasyon hataları (express-validator formatı)
  if (error.response?.data?.errors?.length > 0) {
    return error.response.data.errors[0].message;
  }

  // Network hatası (internet yok, backend ulaşılamıyor)
  if (error.message === 'Network Error' || !error.response) {
    return 'Bağlantı hatası. İnternet bağlantınızı kontrol edin.';
  }

  // Timeout
  if (error.code === 'ECONNABORTED') {
    return 'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.';
  }

  // Bilinmeyen hata
  return 'Beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.';
};

export const showErrorToast = (error, Toast) => {
  Toast.show({
    type: 'error',
    text1: 'Hata',
    text2: getErrorMessage(error),
  });
};
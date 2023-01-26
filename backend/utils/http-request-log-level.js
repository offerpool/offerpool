// Define a custom logger level
export const customLogLevel = (res, err) => {
  if (res.statusCode >= 400 && res.statusCode < 500) {
    return "warn";
  } else if (res.statusCode >= 500 || err) {
    return "error";
  } else if (res.statusCode >= 200 && res.statusCode < 400) {
    return "silent";
  }
  return "info";
};

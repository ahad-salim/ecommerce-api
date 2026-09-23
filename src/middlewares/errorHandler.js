export default function errorHandler(err, req, res, next) {
  console.error(err.stack);
  const statuscode = err.statuscode || 500;
  res.status(statuscode).json({
    success: false,
    error: {
      code: err.code || SEVER_ERROR,
      message: err.message || "Something went wrong on the server",
    },
  });
}

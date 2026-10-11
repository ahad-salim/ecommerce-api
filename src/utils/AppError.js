class AppError extends Error {
  constructor(message, statusCode = 500, code = "SERVER_ERROR") {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.errors = [code];
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError
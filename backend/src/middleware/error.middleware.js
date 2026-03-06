export const errorHandler = (err, req, res, next) => {
    console.error(`[ERROR] ${err.message}`);

    const statusCode = err.statusCode || 500;

    return res.status(statusCode).json({
        status: 'error',
        errorCode: err.errorCode || 'INTERNAL_ERROR',
        message: err.message || 'An unexpected error occurred',
        fieldErrors: err.fieldErrors || [],
    });
};

export class AppError extends Error {
    constructor(message, statusCode = 500, errorCode = 'INTERNAL_ERROR', fieldErrors = []) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.fieldErrors = fieldErrors;
    }
}
export const successResponse = (res, data, statusCode = 200) => {
    return res.status(statusCode).json({
        status: 'success',
        data,
    });
};

export const errorResponse = (res, errorCode, message, statusCode = 400, fieldErrors = []) => {
    return res.status(statusCode).json({
        status: 'error',
        errorCode,
        message,
        fieldErrors,
    });
};
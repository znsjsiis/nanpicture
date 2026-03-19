package com.zn.nanpicturebackend.common;

import com.zn.nanpicturebackend.exception.ErrorCode;

//统一 API 的返回格式
public class ResultUtils {

    public static <T> BaseResponse<T> success(T data) {
        return new BaseResponse<>(0, data, "ok");
    }

    public static BaseResponse error(ErrorCode errorCode) {
        return new BaseResponse<>(errorCode);
    }

    public static BaseResponse<?> error(ErrorCode errorCode, String message) {
        return new BaseResponse(errorCode.getCode(), null, message);
    }

    public static BaseResponse<?> error(int code, String message) {
        return new BaseResponse(code, null, message);
    }

}

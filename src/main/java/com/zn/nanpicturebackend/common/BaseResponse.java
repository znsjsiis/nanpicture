package com.zn.nanpicturebackend.common;

import com.zn.nanpicturebackend.exception.ErrorCode;
import lombok.Data;

import java.io.Serializable;

// API 接口的统一返回格式模型
@Data
public class BaseResponse<T> implements Serializable {
    private int code;

    private T data;

    private String message;

    public BaseResponse(int code, T data, String message) {
        this.code = code;
        this.data = data;
        this.message = message;
    }

    public BaseResponse(int code, T data) {
        this(code, data, "");
    }

    public BaseResponse(ErrorCode errorCode) {
        this(errorCode.getCode(), null, errorCode.getMessage());
    }
}


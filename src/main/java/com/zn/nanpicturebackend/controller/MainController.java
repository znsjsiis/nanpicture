package com.zn.nanpicturebackend.controller;


import com.zn.nanpicturebackend.common.BaseResponse;
import com.zn.nanpicturebackend.common.ResultUtils;
import com.zn.nanpicturebackend.exception.ErrorCode;
import com.zn.nanpicturebackend.exception.ThrowUtils;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.yaml.snakeyaml.representer.BaseRepresenter;

@RestController
@RequestMapping("/")
public class MainController {
    @GetMapping("/health")
    public BaseResponse<String> health() {

        return ResultUtils.success("hello world");

    }
}



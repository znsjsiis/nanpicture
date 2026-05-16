package com.zn.nanpicturebackend.manage.upload;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.StrUtil;
import cn.hutool.http.HttpResponse;
import cn.hutool.http.HttpUtil;
import cn.hutool.http.Method;
import com.zn.nanpicturebackend.exception.BusinessException;
import com.zn.nanpicturebackend.exception.ErrorCode;
import com.zn.nanpicturebackend.exception.ThrowUtils;
import org.springframework.stereotype.Service;

import java.io.File;
import java.net.MalformedURLException;
import java.net.URL;
import java.util.Arrays;
import java.util.List;

/**
 * url上传
 */
@Service
public class UrlPictureUpload extends PictureUploadTemplate {
    @Override
    protected void processFile(Object inputSource, File file) throws Exception {
        String fileUrl = (String) inputSource;
        HttpUtil.downloadFile(fileUrl, file);
    }

    @Override
    protected String getOriginalFilename(Object inputSource) {
        String fileUrl = (String) inputSource;
        return FileUtil.mainName(fileUrl);
    }

    @Override
    protected void validPicture(Object inputSource) {
        String fileUrl = (String) inputSource;
        //校验非空
        ThrowUtils.throwIf(fileUrl == null, ErrorCode.PARAMS_ERROR, "文件不能为空");
        //校验url格式
        try {
            new URL(fileUrl);
        } catch (MalformedURLException e) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件格式错误");
        }
        //校验url的协议
        ThrowUtils.throwIf(!fileUrl.startsWith("http") && !fileUrl.startsWith("https"), ErrorCode.PARAMS_ERROR, "文件格式错误");

        //发送head请求验证文件是否存在
        HttpResponse httpResponse = null;
        try {
            httpResponse = HttpUtil.createRequest(Method.HEAD, fileUrl).execute();
            //未正常返回，无需执行其他判断
            if (!httpResponse.isOk()) {
                return;
            }
            //文件存在，文件类型校验
            String contentType = httpResponse.header("Content-Type");
            //不为空，才校验是否合法，这样校验规则相对宽松
            if (StrUtil.isNotBlank(contentType)) {
                //允许的图片类型
                final List<String> ALlOW_CONTENT_TYPE = Arrays.asList("image/png", "image/jpg", "image/jpeg", "image/webp");
                ThrowUtils.throwIf(!ALlOW_CONTENT_TYPE.contains(contentType.toLowerCase()), ErrorCode.PARAMS_ERROR, "文件类型错误");
            }
            //文件存在，文件大小校验
            String contentLengthStr = httpResponse.header("Content-Length");
            if (StrUtil.isNotBlank(contentLengthStr)) {
                try {
                    long contentLength = Long.parseLong(contentLengthStr);
                    ThrowUtils.throwIf(contentLength > 1024 * 1024 * 2, ErrorCode.PARAMS_ERROR, "文件大小不能超过2MB");
                } catch (NumberFormatException e) {
                    throw new BusinessException(ErrorCode.PARAMS_ERROR, "文件大小格式错误");
                }
            }
        } finally {
            //释放资源
            if (httpResponse != null) {
                httpResponse.close();
            }
        }

    }
}

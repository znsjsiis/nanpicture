package com.zn.nanpicturebackend.controller;

import com.qcloud.cos.model.COSObject;
import com.qcloud.cos.model.COSObjectInputStream;
import com.qcloud.cos.utils.IOUtils;
import com.zn.nanpicturebackend.annotation.AuthCheck;
import com.zn.nanpicturebackend.common.BaseResponse;
import com.zn.nanpicturebackend.common.ResultUtils;
import com.zn.nanpicturebackend.exception.BusinessException;
import com.zn.nanpicturebackend.exception.ErrorCode;
import com.zn.nanpicturebackend.manage.CosManager;
import com.zn.nanpicturebackend.manage.FileManager;
import com.zn.nanpicturebackend.model.dto.file.UploadPictureResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletResponse;
import java.io.File;
import java.io.IOException;

@RestController
@RequestMapping("/file")
@Slf4j
public class FileController {

    private final CosManager cosManager;
    private final FileManager fileManager;

    public FileController(CosManager cosManager, FileManager fileManager) {
        this.cosManager = cosManager;
        this.fileManager = fileManager;
    }

    @PostMapping("/test/upload")
    public BaseResponse<String> testUploadFile(@RequestPart("file") MultipartFile multipartFile) {
        try {
            UploadPictureResult result = fileManager.uploadPicture(multipartFile, "test");
            return ResultUtils.success(result.getUrl());
        } catch (Exception e) {
            log.error("file upload error", e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败");
        }
    }


    @AuthCheck(mustRole = "admin")
    @PostMapping("/test/download/")
    public void testDownloadFile(String filepath, HttpServletResponse response) throws IOException {
        COSObjectInputStream cosObjectInput = null;
        try {
            COSObject cosObject = cosManager.getObject(filepath);
            cosObjectInput = cosObject.getObjectContent();
            byte[] bytes = IOUtils.toByteArray(cosObjectInput);
            //设置响应头
            response.setContentType("application/octet-stream;charset=UTF-8");
            response.setHeader("Content-Disposition", "attachment;filename=" + filepath);
            //写入响应
            response.getOutputStream().write(bytes);
            response.getOutputStream().flush();
        } catch (Exception e) {
            log.error("file download error,filepath = " + filepath, e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "下载失败");
        } finally {
            if (cosObjectInput != null) {
                cosObjectInput.close();
            }
        }
    }
}

package com.zn.nanpicturebackend.manage;

import cn.hutool.core.date.DateUtil;
import cn.hutool.core.io.FileUtil;
import cn.hutool.core.util.NumberUtil;
import cn.hutool.core.util.RandomUtil;
import com.qcloud.cos.model.PutObjectResult;
import com.qcloud.cos.model.ciModel.persistence.ImageInfo;
import com.zn.nanpicturebackend.config.CosClientConfig;
import com.zn.nanpicturebackend.exception.BusinessException;
import com.zn.nanpicturebackend.exception.ErrorCode;
import com.zn.nanpicturebackend.exception.ThrowUtils;
import com.zn.nanpicturebackend.model.dto.file.UploadPictureResult;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import javax.annotation.Resource;

import java.io.File;
import java.util.Arrays;
import java.util.Date;
import java.util.List;

@Slf4j
@Service
public class FileManager {

    @Resource
    private CosClientConfig cosClientConfig;

    @Resource
    private CosManager cosManager;

    /**
     * 上传图片
     *
     * @param multipartFile
     * @param uploadPathprefix
     * @return
     */
    public UploadPictureResult uploadPicture(MultipartFile multipartFile, String uploadPathprefix) {
        //校验图片
        validPicture(multipartFile);
        //图片上传地址
        String uuid = RandomUtil.randomString(16);
        String originalFilename = multipartFile.getOriginalFilename();
        //自己拼接文件上传路径，而不是使用原始文件名称，增加文件安全性
        String uploadFilename = String.format("%s.%s.%s", DateUtil.formatDate(new Date()), uuid,
                FileUtil.getSuffix(originalFilename));
        String uploadPath = String.format("/%s/%s", uploadPathprefix, uploadFilename);
        //解析结果并返回
        File file = null;
        try {
            //上传文件
            file = File.createTempFile(uploadPath, null);
            multipartFile.transferTo(file);
            PutObjectResult putObjectResult = cosManager.putPictureObject(uploadPath, file);
            //获取图像信息对象
            ImageInfo imageInfo = putObjectResult.getCiUploadResult().getOriginalInfo().getImageInfo();
            //返回封装结果
            int picWidth = imageInfo.getWidth();
            int picHeight = imageInfo.getHeight();
            double picScale = NumberUtil.round(picWidth * 1.0 / picHeight, 2).doubleValue();

            UploadPictureResult uploadPictureResult = new UploadPictureResult();
            uploadPictureResult.setUrl(cosClientConfig.getHost() + "/" + uploadPath);
            uploadPictureResult.setPicName(FileUtil.mainName(originalFilename));
            uploadPictureResult.setPicSize(FileUtil.size(file));
            uploadPictureResult.setPicWidth(picWidth);
            uploadPictureResult.setPicHeight(picHeight);
            uploadPictureResult.setPicScale(picScale);
            uploadPictureResult.setPicFormat(imageInfo.getFormat());
            //返回可访问的地址
            return uploadPictureResult;
        } catch (Exception e) {
            log.error("文件上传失败: 文件={}, 错误={}", multipartFile.getOriginalFilename(), e.getMessage(), e);
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "上传失败: " + e.getMessage());
        } finally {
            deleteTempFile(file);
        }
    }

    /**
     * 临时文件清理
     *
     * @param file
     */
    private static void deleteTempFile(File file) {
        if (file != null) {
            //删除临时文件
            boolean delete = file.delete();
            if (!delete) {
                log.error("file delete error,filepath = {} ", file.getAbsolutePath());
            }
        }
    }

    /**
     * 校验图片
     *
     * @param multipartFile
     */
    private void validPicture(MultipartFile multipartFile) {
        ThrowUtils.throwIf(multipartFile == null, ErrorCode.PARAMS_ERROR, "文件不能为空");
        //校验文件大小
        long fileSize = multipartFile.getSize();
        ThrowUtils.throwIf(fileSize > 1024 * 1024 * 2, ErrorCode.PARAMS_ERROR, "文件大小不能超过2MB");
        //校验文件后缀
        String fileSuffix = FileUtil.getSuffix(multipartFile.getOriginalFilename());
        //允许上传的文件后缀列表（或者集合）
        final List<String> ALlOW_FILE_SUFFIX = Arrays.asList("png", "jpg", "jpeg", "webp");
        ThrowUtils.throwIf(!ALlOW_FILE_SUFFIX.contains(fileSuffix), ErrorCode.PARAMS_ERROR, "文件格式错误");
    }

}

package com.zn.nanpicturebackend.service;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zn.nanpicturebackend.model.dto.picture.PictureQueryRequest;
import com.zn.nanpicturebackend.model.dto.picture.PictureReviewRequest;
import com.zn.nanpicturebackend.model.dto.picture.PictureUploadRequest;
import com.zn.nanpicturebackend.model.dto.user.UserQueryRequest;
import com.zn.nanpicturebackend.model.entity.Picture;
import com.zn.nanpicturebackend.model.entity.User;
import com.zn.nanpicturebackend.model.vo.PictureVO;
import org.springframework.web.multipart.MultipartFile;

import javax.servlet.http.HttpServletRequest;

/**
 * @author 张楠
 * @description 针对表【picture(图片)】的数据库操作Service
 * @createDate 2025-12-04 22:24:36
 */
public interface PictureService extends IService<Picture> {

    void validPicture(Picture picture);

    /**
     * 上传图片
     *
     * @param multipartFile
     * @param pictureUploadRequest
     * @param loginUser
     * @return
     */
    PictureVO uploadPicture(MultipartFile multipartFile,
                            PictureUploadRequest pictureUploadRequest,
                            User loginUser);

    /**
     * 获取图片封装类
     *
     * @param picture
     * @param request
     * @return
     */
    PictureVO getPictureVO(Picture picture, HttpServletRequest request);

    /**
     * 获取图片分页封装类
     *
     * @param picturePage
     * @param request
     * @return
     */
    Page<PictureVO> getPictureVOPage(Page<Picture> picturePage, HttpServletRequest request);

    //获取查询条件
    QueryWrapper<Picture> getQueryWrapper(PictureQueryRequest pictureQueryRequest);

    /**
     * 审核图片
     *
     * @param pictureReviewRequest
     * @param loginUser
     * @return
     */
    void doPictureReview(PictureReviewRequest pictureReviewRequest, User loginUser);

    /**
     * 校验文件审核参数
     *
     * @param picture
     * @param loginUser
     */
    void fileReviewParams(Picture picture, User loginUser);
}

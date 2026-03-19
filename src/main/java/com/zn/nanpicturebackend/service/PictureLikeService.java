package com.zn.nanpicturebackend.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zn.nanpicturebackend.model.entity.PictureLike;
import com.zn.nanpicturebackend.model.entity.User;

import javax.servlet.http.HttpServletRequest;

/**
 * 图片点赞服务
 */
public interface PictureLikeService extends IService<PictureLike> {

    /**
     * 点赞/取消点赞
     *
     * @param pictureId
     * @param loginUser
     * @return 是否点赞成功（true: 点赞, false: 取消点赞）
     */
    boolean doPictureLike(long pictureId, User loginUser);

    /**
     * 检查用户是否已点赞
     *
     * @param pictureId
     * @param loginUser
     * @return
     */
    boolean checkPictureLike(long pictureId, User loginUser);

    /**
     * 获取图片点赞数
     *
     * @param pictureId
     * @return
     */
    long getPictureLikeCount(long pictureId);
}
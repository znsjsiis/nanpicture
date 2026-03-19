package com.zn.nanpicturebackend.mapper;

import com.zn.nanpicturebackend.model.entity.Picture;
import com.baomidou.mybatisplus.core.mapper.BaseMapper;

/**
 * @author 张楠
 * @description 针对表【picture(图片)】的数据库操作Mapper
 * @createDate 2025-12-04 22:24:36
 * @Entity com.zn.nanpicturebackend.model.entity.Picture
 */
public interface PictureMapper extends BaseMapper<Picture> {

    /**
     * 更新点赞数
     *
     * @param pictureId
     * @param delta     变化量（+1 或 -1）
     * @return
     */
    int updateLikeCount(long pictureId, int delta);
}





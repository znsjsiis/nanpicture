package com.zn.nanpicturebackend.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zn.nanpicturebackend.model.entity.PictureLike;
import org.apache.ibatis.annotations.Param;

/**
 * 图片点赞 Mapper
 */
public interface PictureLikeMapper extends BaseMapper<PictureLike> {

    /**
     * 物理删除点赞记录（无视逻辑删除）
     */
    int physicalDelete(@Param("pictureId") long pictureId, @Param("userId") long userId);
}
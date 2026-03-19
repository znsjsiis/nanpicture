package com.zn.nanpicturebackend.model.dto.picture;

import lombok.Data;

import java.io.Serializable;

/**
 * 图片点赞请求
 */
@Data
public class PictureLikeRequest implements Serializable {

    /**
     * 图片 id
     */
    private Long id;

    private static final long serialVersionUID = 1L;
}
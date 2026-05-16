package com.zn.nanpicturebackend.api.imagesearch.model;

import lombok.Data;

@Data
public class ImageSearchResult {

    /**
     * 缩略图地址
     */
    private String thumbUrl;

    /**
     * 原图地址
     */
    private String fromUrl;
}
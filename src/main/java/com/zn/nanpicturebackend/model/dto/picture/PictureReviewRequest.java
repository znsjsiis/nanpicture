package com.zn.nanpicturebackend.model.dto.picture;

import lombok.Data;

import java.io.Serializable;
import java.util.Date;
import java.util.List;

/**
 * 图片审核请求
 *
 * @author nan
 * @date 2023/09/05
 */
@Data
public class PictureReviewRequest implements Serializable {


    private Long id;

    /**
     * 审核状态：0-待审核; 1-通过; 2-拒绝
     */
    private Integer reviewStatus;

    /**
     * 审核信息
     */
    private String reviewMessage;


    private static final long serialVersionUID = 1L;
}

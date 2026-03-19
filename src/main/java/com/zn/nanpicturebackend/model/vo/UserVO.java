package com.zn.nanpicturebackend.model.vo;


import lombok.Data;

import java.io.Serializable;
import java.util.Date;


//查询用户视图（脱敏），查询用户列表时返回
@Data
public class UserVO implements Serializable {
    /**
     * id
     */

    private Long id;

    /**
     * 账号
     */
    private String userAccount;

    /**
     * 用户昵称
     */
    private String userName;

    /**
     * 用户头像
     */
    private String userAvatar;

    /**
     * 用户简介
     */
    private String userProfile;

    /**
     * 用户角色：user/admin
     */
    private String userRole;

    /**
     * 编辑时间
     */
    private Date createTime;


    private static final long serialVersionUID = 1L;


}
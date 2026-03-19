package com.zn.nanpicturebackend.model.dto.user;

import lombok.Data;

import java.io.Serializable;

@Data
public class UserAddRequest implements Serializable {

    private String userName;

    private String userAccount;
    // 用户头像
    private String userAvatar;
    // 用户简介
    private String userProfile;
    // 用户角色：user/admin
    private String userRole;

    private static final long serialVersionUID = 1L;

}

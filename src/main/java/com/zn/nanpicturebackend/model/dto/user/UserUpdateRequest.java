package com.zn.nanpicturebackend.model.dto.user;

import lombok.Data;

import java.io.Serializable;

@Data
public class UserUpdateRequest implements Serializable {

    private Long id;

    private String userName;
    //头像
    private String userAvatar;
    ///描述
    private String userProfile;

    private String userRole;


    private static final long serialVersionUID = 1L;

}

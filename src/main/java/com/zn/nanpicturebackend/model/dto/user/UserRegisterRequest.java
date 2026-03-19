package com.zn.nanpicturebackend.model.dto.user;

import lombok.Data;

import java.io.Serializable;

@Data
public class UserRegisterRequest implements Serializable {

    private static final long serialVersionUID = 4863049307073703381L;

    private String userAccount;

    private String userPassword;

    private String checkPassword;
}

package com.zn.nanpicturebackend.service;

import com.zn.nanpicturebackend.model.vo.LoginUserVO;

import javax.servlet.http.HttpServletRequest;

/**
 * GitHub OAuth 登录服务
 */
public interface GithubOAuthService {

    /**
     * 获取 GitHub 授权 URL
     * @param state 状态参数，用于防 CSRF 攻击
     * @return 授权 URL
     */
    String getAuthorizationUrl(String state);

    /**
     * 处理 GitHub 回调，完成登录
     * @param code GitHub 返回的授权码
     * @param state 状态参数
     * @param request HTTP 请求
     * @return 登录用户信息
     */
    LoginUserVO handleCallback(String code, String state, HttpServletRequest request);
}
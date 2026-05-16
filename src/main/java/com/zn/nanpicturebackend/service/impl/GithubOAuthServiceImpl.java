package com.zn.nanpicturebackend.service.impl;

import cn.hutool.core.util.StrUtil;
import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.zn.nanpicturebackend.config.GithubOAuthConfig;
import com.zn.nanpicturebackend.constant.UserConstant;
import com.zn.nanpicturebackend.exception.BusinessException;
import com.zn.nanpicturebackend.exception.ErrorCode;
import com.zn.nanpicturebackend.model.entity.User;
import com.zn.nanpicturebackend.model.enums.UserRoleEnum;
import com.zn.nanpicturebackend.model.vo.LoginUserVO;
import com.zn.nanpicturebackend.service.GithubOAuthService;
import com.zn.nanpicturebackend.service.UserService;
import lombok.extern.slf4j.Slf4j;
import me.zhyd.oauth.config.AuthConfig;
import me.zhyd.oauth.model.AuthCallback;
import me.zhyd.oauth.model.AuthResponse;
import me.zhyd.oauth.model.AuthUser;
import me.zhyd.oauth.request.AuthGithubRequest;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

/**
 * GitHub OAuth 登录服务实现
 */
@Service
@Slf4j
public class GithubOAuthServiceImpl implements GithubOAuthService {

    // 静态代码块：配置 HTTP 代理（国内访问 GitHub API 需要）
    static {
        System.setProperty("http.proxyHost", "127.0.0.1");
        System.setProperty("http.proxyPort", "7897");
        System.setProperty("https.proxyHost", "127.0.0.1");
        System.setProperty("https.proxyPort", "7897");
    }

    @Resource
    private GithubOAuthConfig githubOAuthConfig;

    @Resource
    private UserService userService;

    @Override
    public String getAuthorizationUrl(String state) {
        AuthGithubRequest authRequest = createAuthRequest();
        return authRequest.authorize(state);
    }

    @Override
    public LoginUserVO handleCallback(String code, String state, HttpServletRequest request) {
        // 1. 创建授权请求
        AuthGithubRequest authRequest = createAuthRequest();

        // 2. 构建回调参数
        AuthCallback callback = new AuthCallback();
        callback.setCode(code);
        callback.setState(state);

        // 3. 获取 GitHub 用户信息
        AuthResponse<AuthUser> response = authRequest.login(callback);
        if (!response.ok()) {
            log.error("GitHub 登录失败: {}", response.getMsg());
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "GitHub 登录失败: " + response.getMsg());
        }

        AuthUser authUser = response.getData();
        String githubId = authUser.getUuid();
        String nickname = authUser.getNickname();
        String avatar = authUser.getAvatar();
        String username = authUser.getUsername();

        // 4. 查询或创建用户
        User user = getOrCreateUser(githubId, nickname, avatar, username);

        // 5. 设置 Session 登录态
        request.getSession().setAttribute(UserConstant.USER_LOGIN_STATE, user);

        return userService.getLoginUserVO(user);
    }

    /**
     * 创建 GitHub 授权请求
     */
    private AuthGithubRequest createAuthRequest() {
        return new AuthGithubRequest(AuthConfig.builder()
                .clientId(githubOAuthConfig.getClientId())
                .clientSecret(githubOAuthConfig.getClientSecret())
                .redirectUri(githubOAuthConfig.getRedirectUri())
                .build());
    }

    /**
     * 查询或创建用户
     */
    private User getOrCreateUser(String githubId, String nickname, String avatar, String username) {
        // 通过 githubId 查询用户
        QueryWrapper<User> queryWrapper = new QueryWrapper<>();
        queryWrapper.eq("github_id", githubId);
        User user = userService.getOne(queryWrapper);

        if (user != null) {
            return user;
        }

        // 创建新用户
        user = new User();
        user.setGithubId(githubId);
        // 使用 GitHub 用户名作为系统用户名
        user.setUserName(StrUtil.isNotBlank(username) ? username : "GitHub用户");
        user.setUserAvatar(avatar);
        user.setUserRole(UserRoleEnum.USER.getValue());
        // 使用 GitHub username 作为账号
        user.setUserAccount(StrUtil.isNotBlank(username) ? "github_" + username : "github_" + githubId.substring(0, 8));
        // 设置默认密码（GitHub 登录用户不需要密码登录，但数据库字段不允许为空）
        user.setUserPassword(userService.getEncryptPassword("github_oauth_user"));

        boolean result = userService.save(user);
        if (!result) {
            throw new BusinessException(ErrorCode.SYSTEM_ERROR, "创建用户失败");
        }

        log.info("GitHub 登录创建新用户: githubId={}, userName={}", githubId, user.getUserName());
        return user;
    }
}
package com.zn.nanpicturebackend.controller;

import cn.hutool.core.util.IdUtil;
import com.zn.nanpicturebackend.common.BaseResponse;
import com.zn.nanpicturebackend.common.ResultUtils;
import com.zn.nanpicturebackend.config.GithubOAuthConfig;
import com.zn.nanpicturebackend.model.vo.LoginUserVO;
import com.zn.nanpicturebackend.service.GithubOAuthService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;
import java.util.concurrent.TimeUnit;

/**
 * OAuth 登录控制器
 */
@RestController
@RequestMapping("/oauth")
@Api(tags = "OAuth 登录接口")
@Slf4j
public class OAuthController {

    @Resource
    private GithubOAuthService githubOAuthService;

    @Resource
    private GithubOAuthConfig githubOAuthConfig;

    @Resource
    private StringRedisTemplate stringRedisTemplate;

    private static final String GITHUB_STATE_PREFIX = "oauth:github:state:";
    private static final long STATE_EXPIRE_TIME = 5 * 60; // 5分钟过期

    /**
     * 获取 GitHub 登录授权 URL
     */
    @GetMapping("/github/url")
    @ApiOperation("获取 GitHub 登录授权 URL")
    public BaseResponse<String> getGithubAuthUrl() {
        // 生成 state，用于防 CSRF 攻击
        String state = IdUtil.simpleUUID();
        // 存储 state 到 Redis，设置过期时间
        stringRedisTemplate.opsForValue().set(
                GITHUB_STATE_PREFIX + state,
                "1",
                STATE_EXPIRE_TIME,
                TimeUnit.SECONDS
        );

        String authUrl = githubOAuthService.getAuthorizationUrl(state);
        log.info("生成 GitHub 授权 URL, state={}", state);
        return ResultUtils.success(authUrl);
    }

    /**
     * GitHub 登录回调
     */
    @GetMapping("/github/callback")
    @ApiOperation("GitHub 登录回调")
    public String githubCallback(
            @RequestParam("code") String code,
            @RequestParam("state") String state,
            HttpServletRequest request) {

        // 1. 校验 state
        String stateKey = GITHUB_STATE_PREFIX + state;
        String stateValue = stringRedisTemplate.opsForValue().get(stateKey);
        if (stateValue == null) {
            log.error("GitHub 回调 state 无效或已过期, state={}", state);
            return "<script>alert('登录失败：state 无效或已过期');window.location.href='/user/login';</script>";
        }
        // 删除已使用的 state
        stringRedisTemplate.delete(stateKey);

        try {
            // 2. 处理登录
            LoginUserVO loginUserVO = githubOAuthService.handleCallback(code, state, request);
            log.info("GitHub 登录成功, userName={}", loginUserVO.getUserName());

            // 3. 重定向到前端登录成功页面
            String frontendUrl = githubOAuthConfig.getFrontendUrl();
            return "<script>window.location.href='" + frontendUrl + "/user/login/success?userName=" +
                    loginUserVO.getUserName() + "';</script>";
        } catch (Exception e) {
            log.error("GitHub 登录失败", e);
            String frontendUrl = githubOAuthConfig.getFrontendUrl();
            return "<script>alert('登录失败：" + e.getMessage() + "');window.location.href='" + frontendUrl + "/user/login';</script>";
        }
    }
}
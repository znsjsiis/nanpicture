package com.zn.nanpicturebackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * GitHub OAuth 配置
 */
@Configuration
@ConfigurationProperties(prefix = "github")
@Data
public class GithubOAuthConfig {
    /**
     * GitHub OAuth App Client ID
     */
    private String clientId;

    /**
     * GitHub OAuth App Client Secret
     */
    private String clientSecret;

    /**
     * 回调地址
     */
    private String redirectUri;

    /**
     * 前端地址
     */
    private String frontendUrl = "http://localhost:5173";
}
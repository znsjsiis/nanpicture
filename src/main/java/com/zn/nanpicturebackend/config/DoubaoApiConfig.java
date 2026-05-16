package com.zn.nanpicturebackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 豆包 API 配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "doubao.api")
public class DoubaoApiConfig {

    /**
     * API 地址
     */
    private String apiUrl = "https://ark.cn-beijing.volces.com/api/v3";

    /**
     * API Key (在火山引擎控制台获取)
     */
    private String apiKey;

    /**
     * 模型 ID (如：doubao-pro-4k-240515)
     */
    private String modelId = "doubao-pro-4k-240515";

    /**
     * 连接超时时间 (毫秒)
     */
    private Integer connectTimeout = 5000;

    /**
     * 读取超时时间 (毫秒)
     */
    private Integer readTimeout = 30000;
}

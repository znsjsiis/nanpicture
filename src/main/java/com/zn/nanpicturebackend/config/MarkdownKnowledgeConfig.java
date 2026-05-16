package com.zn.nanpicturebackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Markdown 知识库配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "markdown.knowledge")
public class MarkdownKnowledgeConfig {

    /**
     * 是否启用 Markdown 知识库
     */
    private Boolean enabled = true;

    /**
     * Markdown 文件存储目录（相对于 resources 目录）
     */
    private String directory = "knowledge";

    /**
     * 支持的文件扩展名
     */
    private String[] extensions = {".md", ".txt"};

    /**
     * 最大文件大小（字节），默认 10MB
     */
    private Long maxFileSize = 10 * 1024 * 1024L;

    /**
     * 是否缓存文件内容
     */
    private Boolean cacheEnabled = true;

    /**
     * 缓存过期时间（秒），默认 5 分钟
     */
    private Long cacheExpireSeconds = 300L;
}

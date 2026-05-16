package com.zn.nanpicturebackend.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * 豆包知识库配置
 */
@Data
@Component
@ConfigurationProperties(prefix = "doubao.knowledge")
public class DoubaoKnowledgeConfig {

    /**
     * 是否启用知识库
     */
    private Boolean enabled = false;

    /**
     * 知识库 ID 列表（火山引擎控制台创建的知识库）
     * 示例：["kb-123456", "kb-789012"]
     */
    private String[] knowledgeBaseIds = {};

    /**
     * 检索策略：0-自动选择，1-仅使用知识库，2-仅使用模型，3-知识库 + 模型
     */
    private Integer retrievalStrategy = 0;

    /**
     * 最大引用条数
     */
    private Integer topK = 3;

    /**
     * 相似度阈值（0-1 之间）
     */
    private Double threshold = 0.5;
}

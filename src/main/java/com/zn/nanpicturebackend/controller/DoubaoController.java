package com.zn.nanpicturebackend.controller;

import com.zn.nanpicturebackend.config.DoubaoApiConfig;
import com.zn.nanpicturebackend.service.DoubaoService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.util.HashMap;
import java.util.Map;

/**
 * 豆包 AI 接口
 */
@Slf4j
@RestController
@RequestMapping("/doubao")
@Api(tags = "豆包 AI 接口")
public class DoubaoController {

    @Resource
    private DoubaoService doubaoService;

    @Resource
    private DoubaoApiConfig doubaoApiConfig;

    /**
     * 简单对话
     */
    @PostMapping("/chat")
    @ApiOperation("简单对话")
    public Map<String, Object> chat(
            @ApiParam("用户消息") @RequestParam String message) {
        Map<String, Object> result = new HashMap<>();
        try {
            String reply = doubaoService.chat(message);
            result.put("code", 0);
            result.put("data", reply);
            result.put("message", "success");
        } catch (Exception e) {
            log.error("对话失败", e);
            result.put("code", -1);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 带系统提示词的对话
     */
    @PostMapping("/chatWithPrompt")
    @ApiOperation("带系统提示词的对话")
    public Map<String, Object> chatWithPrompt(
            @ApiParam("用户消息") @RequestParam String message,
            @ApiParam("系统提示词") @RequestParam(required = false) String systemPrompt) {
        Map<String, Object> result = new HashMap<>();
        try {
            String reply = doubaoService.chat(message, systemPrompt);
            result.put("code", 0);
            result.put("data", reply);
            result.put("message", "success");
        } catch (Exception e) {
            log.error("对话失败", e);
            result.put("code", -1);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 带知识库的对话（RAG）
     */
    @PostMapping("/chatWithKnowledge")
    @ApiOperation("带知识库的对话（RAG）")
    public Map<String, Object> chatWithKnowledge(
            @ApiParam("用户消息") @RequestParam String message,
            @ApiParam("系统提示词") @RequestParam(required = false) String systemPrompt,
            @ApiParam("知识库 ID 列表，逗号分隔") @RequestParam(required = false) String knowledgeBaseIds) {
        Map<String, Object> result = new HashMap<>();
        try {
            String[] kbIds = null;
            if (knowledgeBaseIds != null && !knowledgeBaseIds.trim().isEmpty()) {
                kbIds = knowledgeBaseIds.split(",");
            }

            String reply = doubaoService.chatWithKnowledge(message, systemPrompt, kbIds);
            result.put("code", 0);
            result.put("data", reply);
            result.put("message", "success");
            result.put("info", "使用知识库增强回答");
        } catch (Exception e) {
            log.error("知识库对话失败", e);
            result.put("code", -1);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 基于自定义文本的对话（无需创建知识库）
     */
    @PostMapping("/chatWithText")
    @ApiOperation("基于自定义文本的对话")
    public Map<String, Object> chatWithText(
            @ApiParam("用户问题") @RequestParam String question,
            @ApiParam("背景文本/参考资料") @RequestParam String contextText,
            @ApiParam("系统提示词") @RequestParam(required = false) String systemPrompt) {
        Map<String, Object> result = new HashMap<>();
        try {
            // 构建包含背景文本的系统提示词
            String fullSystemPrompt = String.format(
                    "请根据以下背景知识回答问题：\n\n【背景知识】\n%s\n\n【要求】\n1. 仅基于上述背景知识回答\n2. 如果背景知识中没有相关信息，请直接说明\n3. 回答要准确、简洁",
                    contextText
            );

            // 如果有额外的系统提示词，追加到前面
            if (systemPrompt != null && !systemPrompt.isEmpty()) {
                fullSystemPrompt = systemPrompt + "\n\n" + fullSystemPrompt;
            }

            String reply = doubaoService.chat(question, fullSystemPrompt);

            result.put("code", 0);
            result.put("data", reply);
            result.put("message", "success");
            result.put("info", "使用自定义文本作为背景知识");
        } catch (Exception e) {
            log.error("自定义文本回答失败", e);
            result.put("code", -1);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 测试连接
     */
    @GetMapping("/test")
    @ApiOperation("测试连接")
    public Map<String, Object> test() {
        Map<String, Object> result = new HashMap<>();
        try {
            String reply = doubaoService.chat("你好，请回复'测试成功'");
            result.put("code", 0);
            result.put("data", reply);
            result.put("message", "连接正常");
        } catch (Exception e) {
            log.error("测试失败", e);
            result.put("code", -1);
            result.put("message", "连接失败：" + e.getMessage());
        }
        return result;
    }

    /**
     * 查看原始 API 响应（用于调试）
     */
    @GetMapping("/debug")
    @ApiOperation("查看原始 API 响应（调试用）")
    public Map<String, Object> debug() {
        Map<String, Object> result = new HashMap<>();
        try {
            // 这里会打印完整的请求和响应日志
            String reply = doubaoService.chat("你好");

            result.put("code", 0);
            result.put("data", reply);
            result.put("message", "success");
            result.put("info", "请查看控制台日志中的原始 API 响应内容");

            // 使用传统方式创建 Map（兼容 Java 8）
            Map<String, Object> config = new HashMap<>();
            config.put("apiUrl", doubaoApiConfig.getApiUrl());
            config.put("modelId", doubaoApiConfig.getModelId());
            result.put("config", config);
        } catch (Exception e) {
            log.error("调试失败", e);
            result.put("code", -1);
            result.put("message", "调试失败：" + e.getMessage());
            result.put("info", "请查看控制台日志中的详细错误信息");
        }
        return result;
    }
}

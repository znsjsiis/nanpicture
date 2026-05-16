package com.zn.nanpicturebackend.service;

import cn.hutool.http.HttpRequest;
import cn.hutool.json.JSONArray;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import com.zn.nanpicturebackend.config.DoubaoApiConfig;
import com.zn.nanpicturebackend.config.DoubaoKnowledgeConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.Resource;
import java.util.List;
import java.util.Map;

/**
 * 豆包 AI 服务
 */
@Slf4j
@Service
public class DoubaoService {

    @Resource
    private DoubaoApiConfig doubaoApiConfig;

    @Resource
    private DoubaoKnowledgeConfig knowledgeConfig;

    /**
     * 文本对话
     *
     * @param message 用户消息
     * @return AI 回复内容
     */
    public String chat(String message) {
        return chat(message, null);
    }

    /**
     * 文本对话（带上下文）
     *
     * @param message      用户消息
     * @param systemPrompt 系统提示词
     * @return AI 回复内容
     */
    public String chat(String message, String systemPrompt) {
        return chatWithKnowledge(message, systemPrompt, null);
    }

    /**
     * 带知识库的对话（RAG）
     *
     * @param message          用户消息
     * @param systemPrompt     系统提示词
     * @param knowledgeBaseIds 知识库 ID 数组（为 null 时使用默认配置）
     * @return AI 回复内容
     */
    public String chatWithKnowledge(String message, String systemPrompt, String[] knowledgeBaseIds) {
        try {
            // 构建请求体
            JSONObject requestBody = new JSONObject();
            requestBody.set("model", doubaoApiConfig.getModelId());

            // 构建消息列表
            JSONArray messages = new JSONArray();

            // 添加系统提示词（如果有）
            if (systemPrompt != null && !systemPrompt.isEmpty()) {
                JSONObject systemMessage = new JSONObject();
                systemMessage.set("role", "system");
                systemMessage.set("content", systemPrompt);
                messages.add(systemMessage);
            }

            // 添加用户消息
            JSONObject userMessage = new JSONObject();
            userMessage.set("role", "user");
            userMessage.set("content", message);
            messages.add(userMessage);

            requestBody.set("messages", messages);

            // 如果启用了知识库，添加知识库参数
            if (knowledgeConfig.getEnabled() && (knowledgeBaseIds != null || knowledgeConfig.getKnowledgeBaseIds().length > 0)) {
                JSONObject knowledgeConfigObj = new JSONObject();

                // 使用传入的知识库 ID 或配置中的 ID
                String[] kbIds = knowledgeBaseIds != null ? knowledgeBaseIds : knowledgeConfig.getKnowledgeBaseIds();

                // 构建知识库数组
                JSONArray kbArray = new JSONArray();
                for (String kbId : kbIds) {
                    if (kbId != null && !kbId.trim().isEmpty()) {
                        JSONObject kbObj = new JSONObject();
                        kbObj.set("id", kbId.trim());
                        kbArray.add(kbObj);
                    }
                }

                if (!kbArray.isEmpty()) {
                    knowledgeConfigObj.set("bases", kbArray);

                    // 设置检索策略
                    knowledgeConfigObj.set("strategy", knowledgeConfig.getRetrievalStrategy());

                    // 设置检索参数
                    JSONObject searchParams = new JSONObject();
                    searchParams.set("topK", knowledgeConfig.getTopK());
                    searchParams.set("threshold", knowledgeConfig.getThreshold());
                    knowledgeConfigObj.set("searchParams", searchParams);

                    requestBody.set("knowledge", knowledgeConfigObj);

                    log.info("启用知识库问答，知识库 IDs: {}", kbIds);
                }
            }

            // 发送请求
            String response = HttpRequest.post(doubaoApiConfig.getApiUrl() + "/chat/completions")
                    .header("Authorization", "Bearer " + doubaoApiConfig.getApiKey())
                    .header("Content-Type", "application/json")
                    .body(requestBody.toString())
                    .timeout(doubaoApiConfig.getReadTimeout())
                    .execute()
                    .body();

            log.info("豆包 API 原始响应：{}", response);

            // 解析响应
            JSONObject jsonResponse = JSONUtil.parseObj(response);

            // 检查是否包含错误信息
            if (jsonResponse.containsKey("error")) {
                JSONObject error = jsonResponse.getJSONObject("error");
                String errorMsg = error.getStr("message", "未知错误");
                String errorCode = error.getStr("code", "UNKNOWN");
                log.error("豆包 API 返回错误：code={}, message={}", errorCode, errorMsg);
                throw new RuntimeException("豆包 API 错误：" + errorMsg);
            }

            // 检查是否包含 choices
            if (!jsonResponse.containsKey("choices")) {
                log.error("豆包 API 响应中缺少 choices 字段，响应内容：{}", response);
                throw new RuntimeException("豆包 API 响应格式异常：缺少 choices 字段");
            }

            JSONArray choices = jsonResponse.getJSONArray("choices");
            if (choices.isEmpty()) {
                log.error("豆包 API 响应中 choices 为空数组，响应内容：{}", response);
                throw new RuntimeException("豆包 API 响应格式异常：choices 为空");
            }

            JSONObject choice = choices.getJSONObject(0);
            JSONObject messageObj = choice.getJSONObject("message");

            if (messageObj == null) {
                log.error("豆包 API 响应中 message 为 null，响应内容：{}", response);
                throw new RuntimeException("豆包 API 响应格式异常：message 为 null");
            }

            if (!messageObj.containsKey("content")) {
                log.error("豆包 API 响应中缺少 content 字段，响应内容：{}", response);
                throw new RuntimeException("豆包 API 响应格式异常：缺少 content 字段");
            }

            String reply = messageObj.getStr("content");
            log.info("豆包 AI 回复：{}", reply);
            return reply;

        } catch (Exception e) {
            log.error("调用豆包 API 失败", e);
            throw new RuntimeException("调用豆包 API 失败：" + e.getMessage(), e);
        }
    }

    /**
     * 流式对话（简化版，实际使用中可能需要使用 SSE）
     *
     * @param message 用户消息
     * @return AI 回复内容
     */
    public String chatStream(String message) {
        // 注意：完整的流式响应需要使用 Server-Sent Events (SSE)
        // 这里提供基础实现，如需完整流式支持，建议使用 Spring WebFlux 或 Servlet 输出流
        log.warn("流式对话功能需要额外配置 SSE，当前使用普通对话代替");
        return chat(message);
    }

    /**
     * 批量对话
     *
     * @param messages 消息列表
     * @return AI 回复内容
     */
    public String chatWithMessages(List<Map<String, String>> messages) {
        try {
            JSONObject requestBody = new JSONObject();
            requestBody.set("model", doubaoApiConfig.getModelId());

            JSONArray messageArray = new JSONArray();
            for (Map<String, String> msg : messages) {
                JSONObject messageObj = new JSONObject();
                messageObj.set("role", msg.get("role"));
                messageObj.set("content", msg.get("content"));
                messageArray.add(messageObj);
            }

            requestBody.set("messages", messageArray);

            String response = HttpRequest.post(doubaoApiConfig.getApiUrl() + "/chat/completions")
                    .header("Authorization", "Bearer " + doubaoApiConfig.getApiKey())
                    .header("Content-Type", "application/json")
                    .body(requestBody.toString())
                    .timeout(doubaoApiConfig.getReadTimeout())
                    .execute()
                    .body();

            log.info("豆包 API 原始响应：{}", response);

            JSONObject jsonResponse = JSONUtil.parseObj(response);

            // 检查是否包含错误信息
            if (jsonResponse.containsKey("error")) {
                JSONObject error = jsonResponse.getJSONObject("error");
                String errorMsg = error.getStr("message", "未知错误");
                String errorCode = error.getStr("code", "UNKNOWN");
                log.error("豆包 API 返回错误：code={}, message={}", errorCode, errorMsg);
                throw new RuntimeException("豆包 API 错误：" + errorMsg);
            }

            // 检查是否包含 choices
            if (!jsonResponse.containsKey("choices")) {
                log.error("豆包 API 响应中缺少 choices 字段，响应内容：{}", response);
                throw new RuntimeException("豆包 API 响应格式异常：缺少 choices 字段");
            }

            JSONArray choices = jsonResponse.getJSONArray("choices");
            if (choices.isEmpty()) {
                log.error("豆包 API 响应中 choices 为空数组，响应内容：{}", response);
                throw new RuntimeException("豆包 API 响应格式异常：choices 为空");
            }

            JSONObject choice = choices.getJSONObject(0);
            JSONObject messageObj = choice.getJSONObject("message");

            if (messageObj == null) {
                log.error("豆包 API 响应中 message 为 null，响应内容：{}", response);
                throw new RuntimeException("豆包 API 响应格式异常：message 为 null");
            }

            if (!messageObj.containsKey("content")) {
                log.error("豆包 API 响应中缺少 content 字段，响应内容：{}", response);
                throw new RuntimeException("豆包 API 响应格式异常：缺少 content 字段");
            }

            return messageObj.getStr("content");

        } catch (Exception e) {
            log.error("调用豆包 API 失败", e);
            throw new RuntimeException("调用豆包 API 失败：" + e.getMessage(), e);
        }
    }
}

package com.zn.nanpicturebackend.util;

import cn.hutool.http.HttpRequest;
import cn.hutool.json.JSONObject;
import cn.hutool.json.JSONUtil;
import lombok.extern.slf4j.Slf4j;

/**
 * 豆包 API 调试工具
 * 用于测试 API 连接和查看原始响应
 */
@Slf4j
public class DoubaoApiTester {

    /**
     * 测试 API 连接
     *
     * @param apiKey  你的 API Key
     * @param apiUrl  API 地址
     * @param modelId 模型 ID
     * @param message 测试消息
     * @return 原始响应 JSON
     */
    public static String testConnection(String apiKey, String apiUrl, String modelId, String message) {
        try {
            JSONObject requestBody = new JSONObject();
            requestBody.set("model", modelId);

            JSONObject userMessage = new JSONObject();
            userMessage.set("role", "user");
            userMessage.set("content", message);

            cn.hutool.json.JSONArray messages = new cn.hutool.json.JSONArray();
            messages.put(userMessage.toBean(JSONObject.class));
            requestBody.set("messages", messages);

            String response = HttpRequest.post(apiUrl + "/chat/completions")
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .body(requestBody.toString())
                    .timeout(30000)
                    .execute()
                    .body();

            log.info("===== 豆包 API 原始响应 =====");
            log.info(response);
            log.info("===========================");

            // 格式化输出
            JSONObject jsonResponse = JSONUtil.parseObj(response);
            String formattedResponse = jsonResponse.toStringPretty();
            log.info("格式化后的响应:\n{}", formattedResponse);

            return response;

        } catch (Exception e) {
            log.error("测试失败", e);
            throw new RuntimeException("测试失败：" + e.getMessage(), e);
        }
    }

    /**
     * 检查 API Key 是否有效
     */
    public static boolean validateApiKey(String apiKey, String apiUrl) {
        try {
            // 尝试调用一个简单的接口
            String response = HttpRequest.get(apiUrl + "/models")
                    .header("Authorization", "Bearer " + apiKey)
                    .timeout(5000)
                    .execute()
                    .body();

            log.info("API Key 验证响应：{}", response);
            return true;

        } catch (Exception e) {
            log.error("API Key 验证失败", e);
            return false;
        }
    }
}

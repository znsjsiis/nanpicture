package com.zn.nanpicturebackend.controller;

import com.zn.nanpicturebackend.service.DoubaoService;
import com.zn.nanpicturebackend.service.MarkdownKnowledgeService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import io.swagger.annotations.ApiParam;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import javax.annotation.Resource;
import java.io.File;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Markdown 知识库问答接口
 */
@Slf4j
@RestController
@RequestMapping("/doubao/markdown")
@Api(tags = "Markdown 知识库问答")
public class MarkdownKnowledgeController {

    @Resource
    private MarkdownKnowledgeService knowledgeService;

    @Resource
    private DoubaoService doubaoService;

    /**
     * 列出所有可用的 Markdown 文件
     */
    @GetMapping("/list")
    @ApiOperation("列出所有可用的 Markdown 文件")
    public Map<String, Object> listFiles() {
        Map<String, Object> result = new HashMap<>();
        try {
            List<File> files = knowledgeService.listAvailableFiles();
            List<String> fileNames = knowledgeService.getAvailableFileNames();

            // 使用传统方式创建 Map（兼容 Java 8）
            Map<String, Object> data = new HashMap<>();
            data.put("files", fileNames);
            data.put("count", files.size());

            result.put("code", 0);
            result.put("message", "success");
            result.put("data", data);
        } catch (Exception e) {
            log.error("获取文件列表失败", e);
            result.put("code", -1);
            result.put("message", "获取文件列表失败：" + e.getMessage());
        }
        return result;
    }

    /**
     * 基于单个 Markdown 文件的问答
     */
    @PostMapping("/chat")
    @ApiOperation("基于单个 Markdown 文件的问答")
    public Map<String, Object> chatWithMarkdown(
            @ApiParam("用户问题") @RequestParam String question,
            @ApiParam("系统提示词（可选）") @RequestParam(required = false) String systemPrompt) {

        // 固定使用 company.md 文件
        String filename = "company.md";

        Map<String, Object> result = new HashMap<>();
        try {
            // 读取文件内容
            String content = knowledgeService.readFile(filename);

            // 构建完整的背景文本
            String contextText = String.format("【来自文件：%s】\n\n%s", filename, content);

            // 如果有系统提示词，合并到背景文本中
            if (systemPrompt != null && !systemPrompt.isEmpty()) {
                contextText = systemPrompt + "\n\n" + contextText;
            }

            // 调用 AI 服务
            String reply = doubaoService.chat(question, contextText);

            // 使用传统方式创建 Map（兼容 Java 8）
            Map<String, Object> info = new HashMap<>();
            info.put("filename", filename);
            info.put("contentLength", content.length());

            result.put("code", 0);
            result.put("data", reply);
            result.put("message", "success");
            result.put("info", info);
        } catch (Exception e) {
            log.error("Markdown 知识问答失败", e);
            result.put("code", -1);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 基于多个 Markdown 文件的问答
     */
    @PostMapping("/chatMulti")
    @ApiOperation("基于多个 Markdown 文件的问答")
    public Map<String, Object> chatWithMultiMarkdown(
            @ApiParam("用户问题") @RequestParam String question,
            @ApiParam("Markdown 文件名列表，逗号分隔") @RequestParam List<String> filenames,
            @ApiParam("系统提示词（可选）") @RequestParam(required = false) String systemPrompt) {

        Map<String, Object> result = new HashMap<>();
        try {
            // 读取所有文件内容
            Map<String, String> fileContents = knowledgeService.readFiles(filenames);

            // 构建完整的背景文本
            StringBuilder contextBuilder = new StringBuilder();
            contextBuilder.append("【多文件知识库】\n\n");

            for (Map.Entry<String, String> entry : fileContents.entrySet()) {
                contextBuilder.append(String.format("=== 文件：%s ===\n", entry.getKey()));
                contextBuilder.append(entry.getValue());
                contextBuilder.append("\n\n");
            }

            String contextText = contextBuilder.toString();

            // 如果有系统提示词，添加到前面
            if (systemPrompt != null && !systemPrompt.isEmpty()) {
                contextText = systemPrompt + "\n\n" + contextText;
            }

            // 调用 AI 服务
            String reply = doubaoService.chat(question, contextText);

            // 使用传统方式创建 Map（兼容 Java 8）
            Map<String, Object> info = new HashMap<>();
            info.put("fileCount", fileContents.size());
            info.put("filenames", filenames);
            info.put("totalLength", contextText.length());

            result.put("code", 0);
            result.put("data", reply);
            result.put("message", "success");
            result.put("info", info);
        } catch (Exception e) {
            log.error("多文件 Markdown 知识问答失败", e);
            result.put("code", -1);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 读取指定 Markdown 文件的内容
     */
    @GetMapping("/read")
    @ApiOperation("读取指定 Markdown 文件的内容")
    public Map<String, Object> readFileContent(
            @ApiParam("Markdown 文件名") @RequestParam String filename) {

        Map<String, Object> result = new HashMap<>();
        try {
            String content = knowledgeService.readFile(filename);

            // 使用传统方式创建 Map（兼容 Java 8）
            Map<String, Object> data = new HashMap<>();
            data.put("filename", filename);
            data.put("content", content);
            data.put("length", content.length());

            result.put("code", 0);
            result.put("data", data);
            result.put("message", "success");
        } catch (Exception e) {
            log.error("读取文件失败", e);
            result.put("code", -1);
            result.put("message", e.getMessage());
        }
        return result;
    }

    /**
     * 清除文件缓存
     */
    @PostMapping("/clearCache")
    @ApiOperation("清除文件缓存")
    public Map<String, Object> clearCache() {
        Map<String, Object> result = new HashMap<>();
        try {
            knowledgeService.clearCache();

            result.put("code", 0);
            result.put("message", "缓存已清除");
        } catch (Exception e) {
            log.error("清除缓存失败", e);
            result.put("code", -1);
            result.put("message", "清除缓存失败：" + e.getMessage());
        }
        return result;
    }
}

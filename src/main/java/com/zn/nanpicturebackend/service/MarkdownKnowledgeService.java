package com.zn.nanpicturebackend.service;

import cn.hutool.core.io.FileUtil;
import cn.hutool.core.io.resource.ResourceUtil;
import com.zn.nanpicturebackend.config.MarkdownKnowledgeConfig;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.Resource;
import java.io.File;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Markdown 知识库服务
 */
@Slf4j
@Service
public class MarkdownKnowledgeService {

    @Resource
    private MarkdownKnowledgeConfig config;

    /**
     * 文件内容缓存
     */
    private final Map<String, CacheEntry> fileCache = new ConcurrentHashMap<>();

    /**
     * 知识库根目录
     */
    private String knowledgeBasePath;

    @PostConstruct
    public void init() {
        if (config.getEnabled()) {
            // 获取 resources 目录下的 knowledge 目录
            try {
                // 尝试获取资源 URL
                URL resourceUrl = ResourceUtil.getResource(config.getDirectory());
                if (resourceUrl != null) {
                    // 转换为文件系统路径
                    String path = resourceUrl.getPath();
                    // 处理 URL 编码问题（如空格会被编码为%20）
                    path = java.net.URLDecoder.decode(path, StandardCharsets.UTF_8.toString());

                    // 处理 JAR 包内的情况
                    if (path.contains("!/")) {
                        // 在 JAR 包内，使用临时目录解压
                        log.warn("知识库位于 JAR 包内，将使用临时目录：{}", path);
                        knowledgeBasePath = extractJarResources(config.getDirectory());
                    } else {
                        knowledgeBasePath = path;
                    }

                    // 验证路径是否有效
                    File testDir = new File(knowledgeBasePath);
                    if (testDir.exists() && testDir.isDirectory()) {
                        log.info("Markdown 知识库初始化成功，路径：{}", knowledgeBasePath);

                        // 列出所有可用的文件
                        listAvailableFiles().forEach(file ->
                                log.info("发现知识库文件：{}", file.getName()));
                    } else {
                        log.error("知识库路径无效或不可访问：{}", knowledgeBasePath);
                        knowledgeBasePath = null;
                    }
                } else {
                    // 尝试备用方案：直接使用相对路径
                    log.warn("未找到知识库目录：{}，尝试使用备用路径", config.getDirectory());

                    // 方案 1: 尝试当前工作目录
                    File workDir = new File(System.getProperty("user.dir"));
                    File knowledgeDir = new File(workDir, config.getDirectory());
                    if (knowledgeDir.exists() && knowledgeDir.isDirectory()) {
                        knowledgeBasePath = knowledgeDir.getAbsolutePath();
                        log.info("使用工作目录作为知识库路径：{}", knowledgeBasePath);
                    }
                    // 方案 2: 尝试 src/main/resources/knowledge
                    else {
                        knowledgeDir = new File("src/main/resources/" + config.getDirectory());
                        if (knowledgeDir.exists() && knowledgeDir.isDirectory()) {
                            knowledgeBasePath = knowledgeDir.getAbsolutePath();
                            log.info("使用源码目录作为知识库路径：{}", knowledgeBasePath);
                        }
                    }

                    if (knowledgeBasePath == null) {
                        log.error("知识库目录不存在且无法定位：{}", config.getDirectory());
                        log.error("请确保 {} 目录存在于 src/main/resources/ 下，并且已被正确编译到 target/classes/", config.getDirectory());
                        knowledgeBasePath = null;
                    } else {
                        // 验证新路径
                        listAvailableFiles().forEach(file ->
                                log.info("发现知识库文件：{}", file.getName()));
                    }
                }
            } catch (Exception e) {
                log.error("Markdown 知识库初始化失败：{}", e.getMessage(), e);
                knowledgeBasePath = null;
            }
        } else {
            log.info("Markdown 知识库功能未启用");
        }
    }
// ... existing code ...


    /**
     * 读取单个文件内容
     *
     * @param filename 文件名（如：company.md）
     * @return 文件内容
     */
    public String readFile(String filename) {
        if (!config.getEnabled()) {
            throw new RuntimeException("Markdown 知识库未启用");
        }

        // 检查缓存
        if (config.getCacheEnabled() && fileCache.containsKey(filename)) {
            CacheEntry entry = fileCache.get(filename);
            if (!entry.isExpired()) {
                log.debug("从缓存读取文件：{}", filename);
                return entry.getContent();
            } else {
                log.debug("缓存已过期，重新读取：{}", filename);
                fileCache.remove(filename);
            }
        }

        // 优先尝试从类路径直接读取
        String content = readFromClassPath(filename);

        // 如果类路径读取失败，再尝试从文件系统读取
        if (content == null && knowledgeBasePath != null) {
            content = readFromFileSystem(filename);
        }

        if (content == null) {
            throw new RuntimeException("无法读取文件：" + filename + "，请确保文件存在于 resources/" + config.getDirectory() + " 目录下");
        }

        // 存入缓存
        if (config.getCacheEnabled()) {
            fileCache.put(filename, new CacheEntry(content, config.getCacheExpireSeconds()));
        }

        log.info("成功读取文件：{}，大小：{} bytes", filename, content.length());
        return content;
    }

    /**
     * 从类路径读取文件
     */
    private String readFromClassPath(String filename) {
        try {
            String resourcePath = config.getDirectory() + "/" + filename;
            return ResourceUtil.readUtf8Str(resourcePath);
        } catch (Exception e) {
            log.debug("从类路径读取文件失败：{} - {}", filename, e.getMessage());
            return null;
        }
    }

    /**
     * 从文件系统读取文件
     */
    private String readFromFileSystem(String filename) {
        try {
            // 构建完整路径
            String filePath = knowledgeBasePath + File.separator + filename;
            File file = new File(filePath);

            // 验证文件
            validateFile(file, filename);

            // 读取文件内容
            return FileUtil.readString(file, StandardCharsets.UTF_8);
        } catch (Exception e) {
            log.debug("从文件系统读取文件失败：{} - {}", filename, e.getMessage());
            return null;
        }
    }

    /**
     * 读取多个文件内容
     *
     * @param filenames 文件名列表
     * @return 文件内容映射表
     */
    public Map<String, String> readFiles(List<String> filenames) {
        Map<String, String> result = new HashMap<>();
        for (String filename : filenames) {
            try {
                String content = readFile(filename);
                result.put(filename, content);
            } catch (Exception e) {
                log.error("读取文件 {} 失败：{}", filename, e.getMessage());
                result.put(filename, "ERROR: " + e.getMessage());
            }
        }
        return result;
    }

    /**
     * 列出所有可用的 Markdown 文件
     *
     * @return 文件列表
     */
    public List<File> listAvailableFiles() {
        if (!config.getEnabled()) {
            return Collections.emptyList();
        }

        // 尝试从类路径扫描
        List<File> classPathFiles = scanFromClassPath();
        if (!classPathFiles.isEmpty()) {
            return classPathFiles;
        }

        // 如果类路径扫描失败，从文件系统扫描
        if (knowledgeBasePath != null) {
            return scanFromFileSystem();
        }

        return Collections.emptyList();
    }

    /**
     * 从类路径扫描文件
     */
    private List<File> scanFromClassPath() {
        try {
            // 获取知识库目录的 URL
            URL resourceUrl = ResourceUtil.getResource(config.getDirectory());
            if (resourceUrl == null) {
                return Collections.emptyList();
            }

            List<File> result = new ArrayList<>();
            String protocol = resourceUrl.getProtocol();

            // 根据协议类型采用不同的扫描方式
            if ("file".equals(protocol)) {
                // 文件系统方式
                File dir = new File(resourceUrl.getPath());
                if (dir.exists() && dir.isDirectory()) {
                    File[] files = dir.listFiles((d, name) -> {
                        for (String ext : config.getExtensions()) {
                            if (name.toLowerCase().endsWith(ext)) {
                                return true;
                            }
                        }
                        return false;
                    });

                    if (files != null) {
                        result.addAll(Arrays.asList(files));
                    }
                }
            } else if ("jar".equals(protocol)) {
                // JAR 包方式 - 使用 ClassGraph 或直接读取 JAR
                // 简单方案：直接返回已知文件（适用于开发环境）
                log.debug("JAR 包模式，跳过类路径扫描");
                return Collections.emptyList();
            }

            if (!result.isEmpty()) {
                log.debug("从类路径扫描到 {} 个文件", result.size());
            }
            return result;
        } catch (Exception e) {
            log.debug("从类路径扫描文件失败：{}", e.getMessage());
            return Collections.emptyList();
        }
    }

    /**
     * 从文件系统扫描文件
     */
    private List<File> scanFromFileSystem() {
        File dir = new File(knowledgeBasePath);
        if (!dir.exists() || !dir.isDirectory()) {
            log.warn("知识库目录不存在或不是目录：{}", knowledgeBasePath);
            return Collections.emptyList();
        }

        File[] files = dir.listFiles((d, name) -> {
            for (String ext : config.getExtensions()) {
                if (name.toLowerCase().endsWith(ext)) {
                    return true;
                }
            }
            return false;
        });

        return files != null ? Arrays.asList(files) : Collections.emptyList();
    }


    /**
     * 获取所有可用的文件名（不含路径）
     *
     * @return 文件名列表
     */
    public List<String> getAvailableFileNames() {
        List<File> files = listAvailableFiles();
        List<String> names = new ArrayList<>();
        for (File file : files) {
            names.add(file.getName());
        }
        return names;
    }

    // ... existing code ...

    /**
     * 从 JAR 包中提取资源到临时目录
     */
    private String extractJarResources(String resourcePath) {
        try {
            // 创建临时目录
            File tempDir = File.createTempFile("markdown_knowledge_", "");
            tempDir.delete();
            tempDir.mkdirs();

            // 获取资源 URL
            URL resourceUrl = ResourceUtil.getResource(resourcePath);
            if (resourceUrl == null || !"jar".equals(resourceUrl.getProtocol())) {
                log.warn("无法定位 JAR 包中的资源：{}", resourcePath);
                return null;
            }

            // 对于 JAR 包内的资源，需要特殊处理
            // 这里简化处理，直接返回 null，让系统使用其他方式读取
            log.warn("JAR 包内资源提取功能暂不支持，将使用备用方案读取文件");
            return null;

        } catch (Exception e) {
            log.error("提取 JAR 包资源失败：{}", e.getMessage(), e);
            return null;
        }
    }


// ... existing code ...


    /**
     * 验证文件合法性
     */
    private void validateFile(File file, String filename) {
        // 检查文件是否存在
        if (!file.exists()) {
            throw new RuntimeException("文件不存在：" + filename);
        }

        // 检查是否是文件（不是目录）
        if (!file.isFile()) {
            throw new RuntimeException("不是有效的文件：" + filename);
        }

        // 检查文件大小
        long fileSize = file.length();
        if (fileSize > config.getMaxFileSize()) {
            throw new RuntimeException(String.format(
                    "文件过大：%.2f MB（最大 %.2f MB）",
                    fileSize / 1024.0 / 1024.0,
                    config.getMaxFileSize() / 1024.0 / 1024.0
            ));
        }

        // 安全检查：防止路径遍历攻击
        String canonicalPath;
        try {
            canonicalPath = file.getCanonicalPath();
            if (!canonicalPath.startsWith(knowledgeBasePath)) {
                throw new RuntimeException("非法的文件路径：" + filename);
            }
        } catch (Exception e) {
            throw new RuntimeException("文件路径验证失败：" + e.getMessage());
        }
    }

    /**
     * 清除缓存
     */
    public void clearCache() {
        fileCache.clear();
        log.info("已清除所有文件缓存");
    }

    /**
     * 缓存条目
     */
    private static class CacheEntry {
        private final String content;
        private final long expireTime;

        public CacheEntry(String content, long expireSeconds) {
            this.content = content;
            this.expireTime = System.currentTimeMillis() + (expireSeconds * 1000);
        }

        public String getContent() {
            return content;
        }

        public boolean isExpired() {
            return System.currentTimeMillis() > expireTime;
        }
    }
}

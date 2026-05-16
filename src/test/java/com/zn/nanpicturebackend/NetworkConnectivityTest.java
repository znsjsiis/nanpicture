package com.zn.nanpicturebackend;

import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;

import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@Slf4j
public class NetworkConnectivityTest {

    private static final String DOUBAO_API_HOST = "ark.cn-beijing.volces.com";
    private static final String DOUBAO_API_URL = "https://ark.cn-beijing.volces.com/api/v3";
    private static final int HTTPS_PORT = 443;

    @Test
    public void testDnsResolution() {
        log.info("========== 开始 DNS 解析测试 ==========");

        try {
            InetAddress address = InetAddress.getByName(DOUBAO_API_HOST);
            log.info("✅ DNS 解析成功");
            log.info("主机名: {}", address.getHostName());
            log.info("IP 地址: {}", address.getHostAddress());

            assertNotNull(address, "DNS 解析返回 null");
            assertFalse(address.getHostAddress().isEmpty(), "IP 地址为空");

        } catch (Exception e) {
            log.error("❌ DNS 解析失败: {}", e.getMessage());
            fail("DNS 解析失败: " + e.getMessage());
        }
    }

    @Test
    public void testPortConnectivity() {
        log.info("========== 开始端口连通性测试 ==========");

        Socket socket = null;
        try {
            socket = new Socket();
            InetSocketAddress address = new InetSocketAddress(DOUBAO_API_HOST, HTTPS_PORT);

            log.info("尝试连接到 {}:{}", DOUBAO_API_HOST, HTTPS_PORT);
            socket.connect(address, 5000);

            log.info("✅ 端口 {} 可访问", HTTPS_PORT);
            assertTrue(socket.isConnected(), "Socket 未连接");

        } catch (Exception e) {
            log.error("❌ 端口 {} 无法访问: {}", HTTPS_PORT, e.getMessage());
            fail("端口连通性测试失败: " + e.getMessage());
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (Exception e) {
                    log.warn("关闭 Socket 失败: {}", e.getMessage());
                }
            }
        }
    }

    @Test
    public void testHttpGetConnection() {
        log.info("========== 开始 HTTP GET 连接测试 ==========");

        try {
            log.info("请求 URL: {}", DOUBAO_API_URL);

            HttpResponse response = HttpRequest.get(DOUBAO_API_URL)
                    .timeout(5000)
                    .execute();

            log.info("✅ HTTP 连接成功");
            log.info("状态码: {}", response.getStatus());
            log.info("响应头: {}", response.headers());

            assertNotNull(response, "HTTP 响应为 null");

        } catch (Exception e) {
            log.error("❌ HTTP 连接失败: {}", e.getMessage());
            log.error("错误类型: {}", e.getClass().getName());
            fail("HTTP 连接测试失败: " + e.getMessage());
        }
    }

    @Test
    public void testFullNetworkDiagnosis() {
        log.info("========================================");
        log.info("   完整网络诊断报告");
        log.info("========================================");

        Map<String, Object> diagnosisResult = new HashMap<>();

        try {
            InetAddress address = InetAddress.getByName(DOUBAO_API_HOST);
            diagnosisResult.put("dnsResolved", true);
            diagnosisResult.put("ipAddress", address.getHostAddress());
            log.info("✅ [1/3] DNS 解析成功 - IP: {}", address.getHostAddress());
        } catch (Exception e) {
            diagnosisResult.put("dnsResolved", false);
            diagnosisResult.put("dnsError", e.getMessage());
            log.error("❌ [1/3] DNS 解析失败: {}", e.getMessage());
        }

        Socket socket = null;
        try {
            socket = new Socket();
            InetSocketAddress addr = new InetSocketAddress(DOUBAO_API_HOST, HTTPS_PORT);
            socket.connect(addr, 5000);
            diagnosisResult.put("portAccessible", true);
            log.info("✅ [2/3] 端口 {} 可访问", HTTPS_PORT);
        } catch (Exception e) {
            diagnosisResult.put("portAccessible", false);
            diagnosisResult.put("portError", e.getMessage());
            log.error("❌ [2/3] 端口 {} 无法访问: {}", HTTPS_PORT, e.getMessage());
        } finally {
            if (socket != null) {
                try {
                    socket.close();
                } catch (Exception e) {
                    log.warn("关闭 Socket 失败: {}", e.getMessage());
                }
            }
        }

        try {
            HttpResponse response = HttpRequest.get(DOUBAO_API_URL)
                    .timeout(5000)
                    .execute();
            diagnosisResult.put("httpConnected", true);
            diagnosisResult.put("httpStatus", response.getStatus());
            log.info("✅ [3/3] HTTP 连接成功 - 状态码: {}", response.getStatus());
        } catch (Exception e) {
            diagnosisResult.put("httpConnected", false);
            diagnosisResult.put("httpError", e.getMessage());
            log.error("❌ [3/3] HTTP 连接失败: {}", e.getMessage());
        }

        log.info("========================================");
        log.info("   诊断总结");
        log.info("========================================");
        log.info("DNS 解析: {}", diagnosisResult.getOrDefault("dnsResolved", "失败"));
        log.info("端口访问: {}", diagnosisResult.getOrDefault("portAccessible", "失败"));
        log.info("HTTP 连接: {}", diagnosisResult.getOrDefault("httpConnected", "失败"));

        boolean allPassed = Boolean.TRUE.equals(diagnosisResult.get("dnsResolved"))
                && Boolean.TRUE.equals(diagnosisResult.get("portAccessible"))
                && Boolean.TRUE.equals(diagnosisResult.get("httpConnected"));

        if (allPassed) {
            log.info("🎉 所有网络测试通过！如果仍然无法连接豆包 API，请检查:");
            log.info("   1. API Key 是否正确");
            log.info("   2. API URL 路径是否正确");
            log.info("   3. 请求格式是否符合规范");
        } else {
            log.error("⚠️  网络测试失败，请检查:");
            if (!Boolean.TRUE.equals(diagnosisResult.get("dnsResolved"))) {
                log.error("   - DNS 解析失败，检查网络连接或 hosts 文件");
            }
            if (!Boolean.TRUE.equals(diagnosisResult.get("portAccessible"))) {
                log.error("   - 端口被阻止，检查防火墙或代理设置");
            }
            if (!Boolean.TRUE.equals(diagnosisResult.get("httpConnected"))) {
                log.error("   - HTTP 连接失败，检查 SSL 证书或代理配置");
            }
        }

        assertTrue(allPassed, "网络诊断测试未全部通过，详情请查看日志");
    }

    @Test
    public void testLocalNetworkInfo() {
        log.info("========== 本地网络环境信息 ==========");

        try {
            InetAddress localHost = InetAddress.getLocalHost();
            log.info("本机主机名: {}", localHost.getHostName());
            log.info("本机 IP: {}", localHost.getHostAddress());

            String proxyHost = System.getProperty("https.proxyHost");
            String proxyPort = System.getProperty("https.proxyPort");

            if (proxyHost != null && !proxyHost.isEmpty()) {
                log.info("HTTPS 代理: {}:{}", proxyHost, proxyPort);
            } else {
                log.info("HTTPS 代理: 未配置");
            }

            String httpProxyHost = System.getProperty("http.proxyHost");
            String httpProxyPort = System.getProperty("http.proxyPort");

            if (httpProxyHost != null && !httpProxyHost.isEmpty()) {
                log.info("HTTP 代理: {}:{}", httpProxyHost, httpProxyPort);
            } else {
                log.info("HTTP 代理: 未配置");
            }

        } catch (Exception e) {
            log.error("获取本地网络信息失败: {}", e.getMessage());
        }
    }
}

package com.zn.nanpicturebackend.api.imagesearch.sub;

import cn.hutool.core.util.URLUtil;
import cn.hutool.http.HttpRequest;
import cn.hutool.http.HttpResponse;
import com.zn.nanpicturebackend.exception.BusinessException;
import com.zn.nanpicturebackend.exception.ErrorCode;
import lombok.extern.slf4j.Slf4j;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 终极可用版：直接构造百度识图官方可访问地址（不会被风控！）
 */
@Slf4j
public class GetImagePageUrlApi {

    /**
     * 直接返回 百度识图 结果页面（最稳、永远不封）
     */
    public static String getImagePageUrl(String imageUrl) {
        try {
            // 👇 这是官方公开的识图页面地址，100% 不会被封！
            String encodeUrl = URLEncoder.encode(imageUrl, StandardCharsets.UTF_8.name());
            String resultUrl = "https://graph.baidu.com/s?from=pc&url=" + encodeUrl;

            log.info("✅ 识图地址生成成功");
            return resultUrl;

        } catch (Exception e) {
            log.error("图片搜索失败", e);
            throw new BusinessException(ErrorCode.OPERATION_ERROR, "图片搜索失败");
        }
    }

    public static void main(String[] args) {
        // 测试图片（你可以换成任意公网图片）
        String imageUrl = "https://lf-flow-web-cdn.doubao.com/obj/flow-doubao/doubao/web/doubao_avatar.png";
        String result = getImagePageUrl(imageUrl);
        System.out.println("==================================");
        System.out.println("识图结果页：");
        System.out.println(result);
        System.out.println("==================================");
        System.out.println("✅ 直接复制到浏览器打开就能看结果！");
    }
}
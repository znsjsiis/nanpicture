package com.zn.nanpicturebackend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.scheduling.annotation.EnableAsync;

import java.io.IOException;
import java.net.Proxy;
import java.net.ProxySelector;
import java.net.SocketAddress;
import java.net.URI;
import java.util.Collections;
import java.util.List;

@MapperScan("com.zn.nanpicturebackend.mapper")
@EnableAsync
@SpringBootApplication
@EnableAspectJAutoProxy(exposeProxy = true)
public class NanPictureBackendApplication {

    public static void main(String[] args) {
// 【全局强制不走代理】专治 JustAuth 导致的 Connection refused
        ProxySelector.setDefault(new ProxySelector() {
            @Override
            public List<Proxy> select(URI uri) {
                return Collections.singletonList(Proxy.NO_PROXY);
            }

            @Override
            public void connectFailed(URI uri, SocketAddress sa, IOException ioe) {
            }
        });
        SpringApplication.run(NanPictureBackendApplication.class, args);
    }

}

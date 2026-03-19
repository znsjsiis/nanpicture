package com.zn.nanpicturebackend;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.EnableAspectJAutoProxy;

@SpringBootApplication
@MapperScan("com.zn.nanpicturebackend.mapper")
@EnableAspectJAutoProxy(exposeProxy = true)
public class NanPictureBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(NanPictureBackendApplication.class, args);
    }

}

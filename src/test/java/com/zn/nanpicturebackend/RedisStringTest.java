package com.zn.nanpicturebackend;

import cn.hutool.http.HttpRequest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.HashMap;
import java.util.Map;

import static org.springframework.test.util.AssertionErrors.*;

@SpringBootTest
public class RedisStringTest {

    @Autowired
    private StringRedisTemplate stringRedisTemplate;


    @Test
    public void testRedisStringOperations() {

        ValueOperations<String, String> valueOps = stringRedisTemplate.opsForValue();


        String key = "testKey";
        String value = "testValue";


        valueOps.set(key, value);
        String storedValue = valueOps.get(key);
        assertEquals("存储的值与预期不一致", value, storedValue);


        String updatedValue = "updatedValue";
        valueOps.set(key, updatedValue);
        storedValue = valueOps.get(key);
        assertEquals("更新后的值与预期不一致", updatedValue, storedValue);


        storedValue = valueOps.get(key);
        assertNotNull("查询的值为空", storedValue);
        assertEquals("查询的值与预期不一致", updatedValue, storedValue);


        stringRedisTemplate.delete(key);
        storedValue = valueOps.get(key);
        assertNull("删除后的值不为空", storedValue);
    }
}

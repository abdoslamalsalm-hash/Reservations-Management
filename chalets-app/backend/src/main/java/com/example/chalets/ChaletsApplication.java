package com.example.chalets;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * نقطة بداية التطبيق.
 * تشغيل هذا الـ main يشغّل خادم Spring Boot على المنفذ 8080.
 */
@SpringBootApplication
public class ChaletsApplication {

    public static void main(String[] args) {
        SpringApplication.run(ChaletsApplication.class, args);
    }
}

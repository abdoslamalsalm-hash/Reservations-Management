package com.example.chalets.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HashMap;
import java.util.Map;

/**
 * نقطة التحقق من كلمة المرور.
 *
 * صفحة تسجيل الدخول ترسل الكلمة هنا. إذا كانت صحيحة تحفظها الواجهة
 * وترسلها في ترويسة X-App-Password مع كل طلب بعدها (شوف AuthFilter).
 *
 * هذا المسار هو الوحيد المفتوح بدون ترويسة.
 */
@RestController
@RequestMapping("/api")
public class AuthController {

    @Value("${app.password}")
    private String appPassword;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> body) {
        String sent = body.get("password");

        boolean ok = sent != null
                && appPassword != null
                && !appPassword.isEmpty()
                && MessageDigest.isEqual(
                        sent.getBytes(StandardCharsets.UTF_8),
                        appPassword.getBytes(StandardCharsets.UTF_8));

        Map<String, Object> result = new HashMap<>();

        if (!ok) {
            result.put("error", "كلمة المرور غير صحيحة");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(result);
        }

        result.put("ok", true);
        return ResponseEntity.ok(result);
    }
}

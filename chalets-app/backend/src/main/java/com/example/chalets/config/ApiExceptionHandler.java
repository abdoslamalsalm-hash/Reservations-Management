package com.example.chalets.config;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.Map;

/**
 * يحوّل الأخطاء إلى ردود JSON واضحة بدل صفحة خطأ طويلة.
 * مثال الرد: { "error": "السعر يجب أن يكون أكبر من صفر" }
 */
@RestControllerAdvice
public class ApiExceptionHandler {

    /** أخطاء التحقق من المدخلات (@Valid) */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> body = new HashMap<>();
        FieldError firstError = ex.getBindingResult().getFieldError();
        body.put("error", firstError != null ? firstError.getDefaultMessage() : "بيانات غير صحيحة");
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }

    /** الأخطاء التي نرميها بأنفسنا في الـ Service */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        Map<String, String> body = new HashMap<>();
        body.put("error", ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(body);
    }
}

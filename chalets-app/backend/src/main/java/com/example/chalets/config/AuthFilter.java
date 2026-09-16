package com.example.chalets.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * حماية بسيطة بكلمة مرور واحدة مشتركة.
 *
 * كل طلب يصل إلى /api/** لازم يحمل ترويسة X-App-Password فيها كلمة المرور،
 * وإلا يُرفض بـ 401. الاستثناءان الوحيدان:
 *   - طلب OPTIONS: يرسله المتصفح تلقائيًا قبل الطلب الحقيقي (فحص CORS)
 *   - /api/login: نقطة التحقق من كلمة المرور نفسها
 *
 * ملاحظة صريحة: هذي حماية على مستوى "من يدخل النظام"، مو حسابات منفصلة.
 * الثلاثة يستخدمون نفس الكلمة، فما نقدر نعرف مين عدّل أو حذف.
 * لو احتجت ذلك لاحقًا نضيف جدول مستخدمين.
 */
@Component
public class AuthFilter extends OncePerRequestFilter {

    /** اسم الترويسة التي تحمل كلمة المرور */
    public static final String HEADER = "X-App-Password";

    @Value("${app.password}")
    private String appPassword;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain
    ) throws ServletException, IOException {

        String path = request.getRequestURI();

        // ما يهمنا إلا مسارات الـ API
        boolean isApi = path.startsWith("/api/");
        boolean isPreflight = "OPTIONS".equalsIgnoreCase(request.getMethod());
        boolean isLogin = path.equals("/api/login");

        if (!isApi || isPreflight || isLogin) {
            chain.doFilter(request, response);
            return;
        }

        if (matches(request.getHeader(HEADER))) {
            chain.doFilter(request, response);
            return;
        }

        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"error\":\"انتهت الجلسة. سجّل الدخول مرة ثانية.\"}");
    }

    /**
     * مقارنة ثابتة الزمن.
     * المقارنة العادية (equals) تتوقف عند أول حرف مختلف، وفرق التوقيت
     * يمكن استغلاله لتخمين الكلمة حرفًا حرفًا. MessageDigest.isEqual تتجنب هذا.
     */
    private boolean matches(String sent) {
        if (sent == null || appPassword == null || appPassword.isEmpty()) {
            return false;
        }
        return MessageDigest.isEqual(
                sent.getBytes(StandardCharsets.UTF_8),
                appPassword.getBytes(StandardCharsets.UTF_8)
        );
    }
}

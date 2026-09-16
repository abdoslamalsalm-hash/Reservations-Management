package com.example.chalets.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.Ordered;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

/**
 * إعداد CORS.
 *
 * الواجهة والـ Backend على عنوانين مختلفين (3000 و 8080 محليًا،
 * ونطاقين مختلفين بعد النشر)، والمتصفح يمنع الاتصال بينهما إلا بإذن صريح.
 *
 * ليش CorsFilter بدل WebMvcConfigurer؟
 * لأن AuthFilter يرد 401 قبل ما يصل الطلب إلى Spring MVC. لو كان إعداد CORS
 * داخل MVC، الرد 401 يطلع بدون ترويسات CORS فيعرضه المتصفح كخطأ CORS غامض
 * بدل "كلمة المرور غير صحيحة". وضع CORS كفلتر بأعلى أولوية يحل هذا.
 */
@Configuration
public class WebConfig {

    /**
     * العناوين المسموح لها. محليًا: http://localhost:3000
     * بعد النشر: رابط Vercel. تفصل بينها بفاصلة لو أكثر من واحد.
     */
    @Value("${app.cors-origin}")
    private String corsOrigin;

    @Bean
    public FilterRegistrationBean<CorsFilter> corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        Arrays.stream(corsOrigin.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .forEach(config::addAllowedOrigin);

        // نسمح بكل الترويسات لأن الواجهة ترسل X-App-Password و Content-Type
        config.addAllowedHeader("*");
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);

        FilterRegistrationBean<CorsFilter> registration =
                new FilterRegistrationBean<>(new CorsFilter(source));

        // لازم يشتغل قبل AuthFilter
        registration.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return registration;
    }
}

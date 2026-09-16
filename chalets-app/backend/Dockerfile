# ===================================================================
# Render لا يدعم Java مباشرة، فنعطيه Docker image.
# البناء على مرحلتين: مرحلة تبني الـ jar، ومرحلة تشغّله فقط.
# السبب: الصورة النهائية ما تحتاج Maven ولا الكود المصدري، فتطلع أصغر وأسرع.
# ===================================================================

# ===== المرحلة 1: البناء =====
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# ننسخ pom.xml وحده أولًا وننزّل المكتبات.
# فائدتها: ما دام pom.xml ما تغيّر، Docker يعيد استخدام هذي الطبقة
# فالنشرات التالية تصير أسرع بكثير.
COPY pom.xml .
RUN mvn -B dependency:go-offline

COPY src ./src
RUN mvn -B clean package -DskipTests

# ===== المرحلة 2: التشغيل =====
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

# Render يمرّر المنفذ في متغيّر PORT، وapplication.properties يقرأه
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]

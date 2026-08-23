FROM maven:3.9.9-eclipse-temurin-17-alpine AS builder
WORKDIR /workspace/app

# Cache Maven dependencies
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build production JAR and extract layers
COPY src ./src
RUN mvn clean package -DskipTests -B
RUN java -Djarmode=tools -jar target/*.jar extract --layers --launcher --destination /workspace/app/extracted

FROM eclipse-temurin:17-jre-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl
RUN addgroup -S spring && adduser -S spring -G spring

# Copy extracted layers in order of change frequency
COPY --from=builder /workspace/app/extracted/dependencies/ ./
COPY --from=builder /workspace/app/extracted/spring-boot-loader/ ./
COPY --from=builder /workspace/app/extracted/snapshot-dependencies/ ./
COPY --from=builder /workspace/app/extracted/application/ ./

RUN chown -R spring:spring /app
USER spring:spring

ENV JAVA_OPTS="-XX:MaxRAMPercentage=75.0 -XX:InitialRAMPercentage=50.0 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"
ENV SERVER_PORT=8080

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS org.springframework.boot.loader.launch.JarLauncher"]

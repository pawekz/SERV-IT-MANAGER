# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Leverage Docker layer caching for faster rebuilds
COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline
COPY src ./src
RUN mvn -q clean package -DskipTests

# Run stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Create non-root user/group with fixed UID/GID
RUN addgroup -S app && adduser -S app -G app -u 10001

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# Copy SSL Certificate (azure)
COPY DigiCertGlobalRootCA.crt.pem /app/DigiCertGlobalRootCA.crt.pem

# Set environment variables (if you want to use a specific profile, e.g., prod)
#ENV SPRING_PROFILES_ACTIVE=prod
ENV SPRING_PROFILES_ACTIVE=azure
# JVM tuning for small App Service (B1): 1 vCPU, constrained RAM
ENV JAVA_TOOL_OPTIONS="-XX:+ExitOnOutOfMemoryError -XX:+UseStringDeduplication -XX:MaxRAMPercentage=65.0 -XX:ActiveProcessorCount=1 -XX:MaxGCPauseMillis=200 -Dfile.encoding=UTF-8 -Djava.security.egd=file:/dev/urandom"

RUN chown -R app:app /app
USER app:app

# Expose port
EXPOSE 8080
ENV WEBSITES_PORT=8080

# Run the application
ENTRYPOINT ["java", "-Dserver.port=8080", "-jar", "app.jar"]

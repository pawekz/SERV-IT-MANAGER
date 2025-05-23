package com.servit.servit.config;

import com.servit.servit.filter.JwtRequestFilter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfig {

    @Autowired
    private final JwtRequestFilter jwtRequestFilter;

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    public SecurityConfig(JwtRequestFilter jwtRequestFilter) {
        this.jwtRequestFilter = jwtRequestFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(withDefaults())
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers(
                                "/user/register",
                                "/auth/login",
                                "/user/verifyOtp",
                                "/user/resendOtp",
                                "/user/forgotPassword",
                                "/user/resetPassword"
                        ).permitAll()
                        .requestMatchers(
                                "/user/getCurrentUser",
                                "/user/changeCurrentUserPassword",
                                "/user/updateCurrentUserFullName",
                                "/user/changeCurrentUserPhoneNumber",
                                "/user/updateCurrentUsername"
                        ).hasAnyRole("CUSTOMER", "ADMIN", "TECHNICIAN")
                        .requestMatchers(
                                "/repairTicket/checkInRepairTicket",
                                "/repairTicket/getRepairTicket/*"
                        ).hasAnyRole("ADMIN", "TECHNICIAN")
                        .requestMatchers(
                                "/user/changeRole/*",
                                "/user/getAllUsers",
                                "/user/getUser/*",
                                "/user/changePassword/*",
                                "/user/updateEmail/*",
                                "/user/updateFullName/*",
                                "/user/deleteUser/*",
                                "/user/updatePhoneNuber/*",
                                "/user/updateUsername/*"
                        ).hasAnyRole("ADMIN")
                        .anyRequest().authenticated()
                )
                .httpBasic(withDefaults())
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
                );
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:5173");
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}

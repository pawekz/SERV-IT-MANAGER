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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfig {
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

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
        logger.debug("Configuring security filter chain");
        
        http
            .csrf(AbstractHttpConfigurer::disable)
            .cors(withDefaults())
            .authorizeHttpRequests(authz -> authz
                    .requestMatchers(
                            "/user/register",
                            "/auth/login",
                            "/user/verifyOtp",
                            "/user/resendOtp",
                            "/user/forgotPassword",
                            "/user/resetPassword",
                            "/feedback/submitFeedback"
                    ).permitAll()
                    .requestMatchers(
                            "/repairTicket/searchRepairTicketsByEmail",
                            "/repairTicket/getRepairTicketsByCustomerEmail"
                    ).hasRole("CUSTOMER")
                    .requestMatchers(
                            "/user/getCurrentUser",
                            "/user/changeCurrentUserPassword",
                            "/user/updateCurrentUserFullName",
                            "/user/changeCurrentUserPhoneNumber",
                            "/user/updateCurrentUsername",
                            "/repairTicket/getRepairTicket/*",
                            "/repairTicket/getRepairTicketDocument/*",
                            "/warranty/checkInWarranty",
                            "/warranty/getWarrantyByCustomerEmail",
                            "/warranty/getWarrantyByNumber",
                            "/warranty/generateWarrantyNumber",
                            "/warranty/check/**",
                            "/part/workflow/verifyWarranty",
                            "part/getPartByPartNumber/"
                    ).hasAnyRole("CUSTOMER", "ADMIN", "TECHNICIAN")
                    .requestMatchers(
                            "/repairTicket/checkInRepairTicket",
                            "/repairTicket/generateRepairTicketNumber",
                            "/repairTicket/getAllRepairTickets",
                            "/user/getTechnicianByEmail",
                            "/repairTicket/getAllRepairTickets",
                            "/repairTicket/uploadRepairTicketDocument/*",
                            "/repairTicket/searchRepairTickets",
                            "/part/addPart",
                            "/part/addBulkParts",
                            "/part/stock/updateStocks/*",
                            "/part/stock/adjustStock/*",
                            "/part/reservePart",
                            "/part/stock/releaseReservedStock/*",
                            "/part/confirmPartUsage/*",
                            "/part/checkLowStockAlert/*",
                            "/part/workflow/verifyWarranty",
                            "/part/workflow/getPartsForQuotation",
                            "/part/workflow/processQuotationApproval",
                            "/part/workflow/receiveSupplierReplacement",
                            "/part/audit/partHistory/*",
                            "/part/audit/ticketHistory/*",
                            "/part/stock/summary/*",
                            "/part/stock/lowStockPartNumbers",
                            "/part/stock/searchPartNumbers",
                            "/part/addPart",
                            "/warranty/getAllWarranties"
                    ).hasAnyRole("ADMIN", "TECHNICIAN")
                    .requestMatchers("/api/admin/backup/**")
                    .hasRole("ADMIN")
                    .requestMatchers(
                            "/user/changeRole/*",
                            "/user/getAllUsers",
                            "/user/getUser/*",
                            "/user/changePassword/*",
                            "/user/updateEmail/*",
                            "/user/updateFullName/*",
                            "/user/deleteUser/*",
                            "/user/updatePhoneNuber/*",
                            "/user/updateUsername/*",
                            "/user/getTechnicians",
                            "/user/getUserCount",
                            "/api/backup/**",
                            "/part/updatePart/*",
                            "/part/deletePart/*",
                            "/part/workflow/processAutoReplacement",
                            "/part/stock/needReorder",
                            "/part/stock/updateTracking",
                            "/part/stock/refreshTracking/*",
                            "/part/stock/refreshAllTracking",
                            "/part/stock/resolveAlert/*"
                    ).hasRole("ADMIN")
                    .requestMatchers("/parts/create").permitAll()
                    .anyRequest().authenticated()
            )
            .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .httpBasic(AbstractHttpConfigurer::disable);
        
        // Add JWT filter before UsernamePasswordAuthenticationFilter
        http.addFilterBefore(jwtRequestFilter, UsernamePasswordAuthenticationFilter.class);
        
        logger.debug("Security filter chain configured successfully");
        return http.build();
    }

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.addAllowedOrigin("http://localhost:5173"); //default port is 5173 in VITE
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}

package com.servit.servit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.util.TimeZone;

@SpringBootApplication
@EnableScheduling
public class ServitApplication {

	public static void main(String[] args) {
		// Set default JVM timezone to UTC+8 early, before Spring context starts
		TimeZone.setDefault(TimeZone.getTimeZone("GMT+8"));
		SpringApplication.run(ServitApplication.class, args);
	}

}

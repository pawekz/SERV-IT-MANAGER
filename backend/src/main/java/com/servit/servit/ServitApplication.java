package com.servit.servit;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ServitApplication {

	public static void main(String[] args) {
		SpringApplication.run(ServitApplication.class, args);
	}

}

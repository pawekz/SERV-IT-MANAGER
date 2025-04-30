package com.servit.servit.controller;

import com.servit.servit.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(method = RequestMethod.GET, path = "/api/user")
public class UserController {

    @Autowired
    private UserService userService;
}

# Software Design Document: SERV-IT Manager - Module 1

## Module 1: User Account and Access Management

### 1.1 User Registration
- **User Interface Design:**
  - The user registration process will be initiated through a dedicated sign-up page. The interface will feature a clean, intuitive form capturing essential user details: username, first name, last name, email, password (with confirmation), and phone number. Upon submission, the system will trigger an OTP verification step. An OTP will be sent to the user's registered email address. The UI will then present a modal or a separate section for the user to input the received OTP. Visual feedback, including loading states via a spinner component, will be provided throughout the process to enhance user experience. Error handling will be implemented to guide users in case of invalid input or system issues.
- **Front-end component(s):**
  - **Component Name:** `SignUpPage.jsx`
    - *Description and purpose:* Provides the user interface for new user registration, including input fields for user details and submission handling. It orchestrates the flow from data entry to OTP verification.
    - *Component type or format:* React Functional Component
  - **Component Name:** `Spinner`
    - *Description and purpose:* A reusable visual indicator used to signify loading or processing states during asynchronous operations like form submission or OTP verification, improving UX by providing feedback.
    - *Component type or format:* React Functional Component
- **Back-end component(s):**
  - **Component Name:** `UserController.java`
    - *Description and purpose:* Manages incoming HTTP requests related to user operations. For registration, it handles endpoints like `/user/register` for initial submission, `/user/verifyOtp` for OTP validation, and `/user/resendOtp` for requesting a new OTP.
    - *Component type or format:* Spring `@RestController`
  - **Component Name:** `UserService.java`
    - *Description and purpose:* Contains the core business logic for user registration, including validation, user creation, OTP generation and verification coordination, and interaction with the data persistence layer.
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `UserEntity.java`
    - *Description and purpose:* Represents the user data model that will be persisted to the database. It defines the structure of the `users` table.
    - *Component type or format:* JPA `@Entity`
  - **Component Name:** `RegistrationRequestDTO.java`
    - *Description and purpose:* A Data Transfer Object used to carry user registration data from the client (front-end) to the `UserController`. Encapsulates fields like username, password, email, etc.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `VerifyOtpRequestDTO.java`
    - *Description and purpose:* A DTO for carrying OTP verification data, typically including the user's email and the OTP they entered. It also includes a type field to distinguish between registration OTP and other OTP uses (e.g., password reset).
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `ResendOtpRequestDTO.java`
    - *Description and purpose:* A DTO used when a user requests a new OTP to be sent, usually containing the user's email and the type of OTP requested.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `OtpService.java`
    - *Description and purpose:* Manages the generation, storage (potentially temporarily), and validation of One-Time Passwords (OTPs).
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `EmailService.java`
    - *Description and purpose:* Responsible for sending emails, specifically the OTP email to the user during registration and potentially other notification emails.
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `EmailUtil.java`
    - *Description and purpose:* A utility class providing helper methods for constructing and sending emails, possibly integrating with a third-party email provider.
    - *Component type or format:* Java Class
  - **Component Name:** `PasswordEncoder`
    - *Description and purpose:* A Spring Security component responsible for encoding (hashing) passwords before they are stored in the database and for verifying submitted passwords against stored hashes.
    - *Component type or format:* Spring Security interface/component (e.g., `BCryptPasswordEncoder`)
  - **Component Name:** `UserRepository.java`
    - *Description and purpose:* An interface extending Spring Data JPA's `JpaRepository`. It provides CRUD operations and custom queries for `UserEntity` objects, abstracting database interactions.
    - *Component type or format:* Spring Data JPA Repository Interface
- **Object-Oriented Components:**
  - **Class Diagram:**
    ```plantuml
    @startuml
    title Class Diagram - User Registration

    !define MIXING
    allowmixing
    top to bottom direction

    ' --- Entities & Enums ---
    class UserEntity <<Entity>> {
      - userId: Integer
      - username: String
      - password: String
      - email: String
      - firstName: String
      - lastName: String
      - role: UserRoleEnum
      - createdAt: LocalDateTime
      - phoneNumber: String
      - isVerified: Boolean
      - status: String
    }

    enum UserRoleEnum {
      ADMIN
      CUSTOMER
      TECHNICIAN
    }

    UserEntity ||--|| UserRoleEnum : contains

    ' --- DTOs for Registration ---
    package "DTOs" {
      class RegistrationRequestDTO <<DTO>> {
        - username: String
        - firstName: String
        - lastName: String
        - email: String
        - password: String
        - phoneNumber: String
      }

      class VerifyOtpRequestDTO <<DTO>> {
        - email: String
        - otp: String
        - type: String
      }

      class ResendOtpRequestDTO <<DTO>> {
        - email: String
        - type: String ' To distinguish OTP type
      }
    }

    ' --- Backend Components ---
    package "Backend" {
      package "Controllers" {
        class UserController <<Controller>> {
          + register(RegistrationRequestDTO): ResponseEntity
          + verifyOtp(VerifyOtpRequestDTO): ResponseEntity
          + resendOtp(ResendOtpRequestDTO): ResponseEntity
        }
      }

      package "Services" {
        class UserService <<Service>> {
          + register(RegistrationRequestDTO)
          + verifyOtp(VerifyOtpRequestDTO)
          + resendOtp(ResendOtpRequestDTO)
        }

        class OtpService <<Service>> {
          ' Assuming internal storage or simplified representation for focus
          ' - otpStore: Map<String, OtpDetails>
          + generateOtp(email: String): String
          + validateOtp(email: String, otp: String): boolean
          ' + cleanupExpiredOtps(): void ' Might be out of focus for pure registration
        }

        class EmailService <<Service>> {
          + sendOtpEmail(to: String, otp: String): void
        }
      }

      package "Repositories" {
        interface UserRepository <<Repository>> {
          + findByEmail(email): Optional<UserEntity>
          + findByUsername(username): Optional<UserEntity>
          + save(userEntity): UserEntity
          + existsByUsername(username): Boolean
          + existsByEmail(email): Boolean
        }
      }

      package "Utils" {
        interface PasswordEncoder <<Utility>> {
          + encode(password: String): String
          + matches(rawPass: String, encodedPass: String): boolean
        }

        class EmailUtil <<Utility>> {
          + {static} sendEmail(to: String, subject: String, htmlBody: String): void
        }
      }
    }


    ' --- Relationships ---

    ' Controller to Service
    UserController --> UserService : uses

    ' Service to Repositories & Entities
    UserService --> UserRepository : manages
    UserService ..> UserEntity : creates/updates

    ' Service to other Services
    UserService --> OtpService : uses for OTP
    UserService --> EmailService : uses for notifications

    ' Service to Utils
    UserService --> PasswordEncoder : uses for hashing

    ' EmailService to EmailUtil (if applicable)
    EmailService --> EmailUtil : delegates sending

    ' Controller uses DTOs (Implied by method signatures, can be explicit)
    UserController ..> RegistrationRequestDTO : accepts
    UserController ..> VerifyOtpRequestDTO : accepts
    UserController ..> ResendOtpRequestDTO : accepts

    @enduml
    ```
  - **Sequence Diagram:**
    ```plantuml
    @startuml
    title User Registration Sequence Diagram

    actor NewUser
    participant "SignUpPage" as FE_SignUp <<Boundary>>
    participant "UserController" as BE_UserCtrl <<Controller>>
    participant "UserService" as BE_UserSvc <<Service>>
    participant "OtpService" as BE_OtpSvc <<Service>>
    participant "EmailService" as BE_EmailSvc <<Service>>
    participant "UserRepository" as BE_UserRepo <<Repository>>
    database Database

    NewUser -> FE_SignUp : Fills registration form & submits
    FE_SignUp -> BE_UserCtrl : POST /user/register (RegistrationRequestDTO)
    activate BE_UserCtrl
    BE_UserCtrl -> BE_UserSvc : register(reqDTO)
    activate BE_UserSvc

    BE_UserSvc -> BE_UserRepo : findByEmail(email)
    activate BE_UserRepo
    BE_UserRepo --> BE_UserSvc : Optional<UserEntity> (empty)
    deactivate BE_UserRepo

    BE_UserSvc -> BE_UserRepo : findByUsername(username)
    activate BE_UserRepo
    BE_UserRepo --> BE_UserSvc : Optional<UserEntity> (empty)
    deactivate BE_UserRepo
    
    BE_UserSvc -> BE_UserSvc : Create UserEntity (unverified, pending)
    BE_UserSvc -> BE_UserSvc : Encode password

    BE_UserSvc -> BE_OtpSvc : generateOtp(email)
    activate BE_OtpSvc
    BE_OtpSvc --> BE_UserSvc : otpValue
    deactivate BE_OtpSvc

    BE_UserSvc ->> BE_EmailSvc : sendOtpEmail(email, otpValue)
    activate BE_EmailSvc
    BE_EmailSvc -->> BE_UserSvc : ack
    deactivate BE_EmailSvc

    BE_UserSvc -> BE_UserRepo : save(UserEntity)
    activate BE_UserRepo
    BE_UserRepo -> Database : Persist user record
    Database --> BE_UserRepo : User record saved
    BE_UserRepo --> BE_UserSvc : Saved UserEntity
    deactivate BE_UserRepo

    BE_UserSvc --> BE_UserCtrl : void (registration initiated)
    deactivate BE_UserSvc
    BE_UserCtrl --> FE_SignUp : HTTP 200 OK (or similar success response)
    deactivate BE_UserCtrl

    FE_SignUp --> NewUser : Displays OTP input modal

    NewUser -> FE_SignUp : Enters OTP & submits
    FE_SignUp -> BE_UserCtrl : POST /user/verifyOtp (VerifyOtpRequestDTO with type=REGISTRATION)
    activate BE_UserCtrl
    BE_UserCtrl -> BE_UserSvc : verifyOtp(verifyReqDTO)
    activate BE_UserSvc

    BE_UserSvc -> BE_UserRepo : findByEmail(email)
    activate BE_UserRepo
    BE_UserRepo --> BE_UserSvc : Optional<UserEntity> (user found)
    deactivate BE_UserRepo

    BE_UserSvc -> BE_OtpSvc : validateOtp(email, otp)
    activate BE_OtpSvc
    BE_OtpSvc --> BE_UserSvc : boolean (true if valid)
    deactivate BE_OtpSvc

    alt OTP valid
      BE_UserSvc -> BE_UserSvc : Update UserEntity (isVerified=true, status="Active")
      BE_UserSvc -> BE_UserRepo : save(UserEntity)
      activate BE_UserRepo
      BE_UserRepo -> Database : Update user record
      Database --> BE_UserRepo : User record updated
      BE_UserRepo --> BE_UserSvc : Updated UserEntity
      deactivate BE_UserRepo
      BE_UserSvc --> BE_UserCtrl : void (OTP verified)
      BE_UserCtrl --> FE_SignUp : HTTP 200 OK (verification success)
      FE_SignUp --> NewUser : Displays success message, redirects to Login
    else OTP invalid or expired
      BE_UserSvc --> BE_UserCtrl : Throws Exception (Invalid OTP)
      BE_UserCtrl --> FE_SignUp : HTTP 400/401 (verification failed)
      FE_SignUp --> NewUser : Displays error message
    end

    deactivate BE_UserSvc
    deactivate BE_UserCtrl
    @enduml
    ```
- **Data Design:**
  - **ERD or schema:**
    ```plantuml
    @startuml
    title Entity Relationship Diagram - Module 1: User Account and Access Management

    entity UserEntity {
      * user_id : INT (PK) <<auto_increment>>
      --
      * username : VARCHAR(255) (NN, UQ)
      * password : TEXT (NN) -- Hashed password
      * email : VARCHAR(255) (NN, UQ)
      * first_name : VARCHAR(100) (NN)
      * last_name : VARCHAR(100) (NN)
      * role : VARCHAR(20) (NN, Enum: ADMIN, CUSTOMER, TECHNICIAN)
      * created_at : TIMESTAMP (NN, Default: CURRENT_TIMESTAMP)
      * phone_number : VARCHAR(20) (NN)
      * is_verified : BOOLEAN (NN, Default: false)
      * status : VARCHAR(20) (NN, Default: "Pending") -- e.g., Pending, Active, Inactive, Deleted
    }

    ' No other entities directly within this module's scope for now.
    ' Relationships to other entities (e.g., OtpDetails if it were an entity) could be shown here.
    ' For now, OtpService manages OTPs internally or via temporary storage.
    @enduml
    ```

### 1.2 User Login
- **User Interface Design:**
  - The login interface will be presented on a dedicated `LoginPage.jsx`. It will feature a form for users to input their credentials (username/email and password). Upon submission, the system will attempt to authenticate the user. Feedback mechanisms like a `Spinner` will indicate processing. Error messages will be displayed using a `Toast` component for issues like invalid credentials, account inactivity, or if the account is not yet verified. If login requires OTP (e.g., for unverified accounts), an `OTPModal` will be displayed. Links or buttons for "Forgot Password" will trigger a `ForgotPasswordModal`, which in turn can lead to a `NewPasswordModal` after OTP verification for password reset.
- **Front-end component(s):**
  - **Component Name:** `LoginPage.jsx`
    - *Description and purpose:* Provides the UI for user authentication. Captures username/email and password, handles form submission, and manages login flow including interactions with OTP and Forgot Password modals.
    - *Component type or format:* React Functional Component
  - **Component Name:** `Spinner`
    - *Description and purpose:* Reusable visual indicator for loading states during login attempt or OTP verification.
    - *Component type or format:* React Functional Component
  - **Component Name:** `Toast`
    - *Description and purpose:* Displays short, non-intrusive messages to the user for login status (e.g., "Invalid credentials", "Login successful", "Account not verified").
    - *Component type or format:* React Functional Component
  - **Component Name:** `OTPModal`
    - *Description and purpose:* A modal dialog used to prompt the user for an OTP if their account is not yet verified during the login process.
    - *Component type or format:* React Functional Component
  - **Component Name:** `ForgotPasswordModal`
    - *Description and purpose:* A modal dialog that allows users to initiate the password reset process by entering their registered email to receive an OTP.
    - *Component type or format:* React Functional Component
  - **Component Name:** `NewPasswordModal`
    - *Description and purpose:* A modal dialog where users can set a new password after successfully verifying an OTP received for password reset.
    - *Component type or format:* React Functional Component
- **Back-end component(s):**
  - **Component Name:** `AuthController.java`
    - *Description and purpose:* Handles HTTP requests related to authentication, primarily the `/auth/login` endpoint. Orchestrates the login process by calling `AuthService`.
    - *Component type or format:* Spring `@RestController`
  - **Component Name:** `AuthService.java`
    - *Description and purpose:* Contains the core business logic for user authentication. Validates credentials, checks user status, and generates JWT upon successful login. Interacts with `UserRepository`, `PasswordEncoder`, and `JwtUtil`.
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `UserService.java`
    - *Description and purpose:* Used by `AuthService` or `AuthController` indirectly to check user status (e.g., `isVerified`) or to trigger OTP resend if login is attempted on an unverified account. (Functionality as described in 1.1)
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `UserEntity.java`
    - *Description and purpose:* Represents the user data model, queried during login to verify credentials and check account status. (As defined in 1.1)
    - *Component type or format:* JPA `@Entity`
  - **Component Name:** `LoginRequestDTO.java`
    - *Description and purpose:* A DTO carrying login credentials (username/email and password) from the client to `AuthController`.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `AuthResponseDTO.java`
    - *Description and purpose:* A DTO sent back to the client upon successful or conditionally successful (e.g., unverified) login. Contains JWT, user role, verification status, and potentially other user details.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `JwtUtil.java`
    - *Description and purpose:* Utility component for generating, parsing, and validating JSON Web Tokens (JWTs) used for session management after login.
    - *Component type or format:* Spring `@Component`
  - **Component Name:** `PasswordEncoder`
    - *Description and purpose:* Used to compare the submitted password with the stored hashed password. (As defined in 1.1)
    - *Component type or format:* Spring Security interface/component
  - **Component Name:** `UserRepository.java`
    - *Description and purpose:* Used to fetch user details from the database based on username or email. (As defined in 1.1)
    - *Component type or format:* Spring Data JPA Repository Interface
  - **Component Name:** `OtpService.java`
    - *Description and purpose:* Manages OTP generation and validation if login flow triggers OTP for unverified accounts. (As defined in 1.1)
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `EmailService.java`
    - *Description and purpose:* Sends OTP emails if login flow triggers OTP for unverified accounts. (As defined in 1.1)
    - *Component type or format:* Spring `@Service`
- **Object-Oriented Components:**
  - **Class Diagram:**
    ```plantuml
    @startuml
    title Class Diagram - User Login

    !define MIXING
    allowmixing
    top to bottom direction

    ' --- Entities & Enums ---
    class UserEntity <<Entity>> {
      - userId: Integer
      - username: String
      - password: String
      - email: String
      - role: UserRoleEnum
      - isVerified: Boolean
      - status: String
    }

    enum UserRoleEnum {
      ADMIN
      CUSTOMER
      TECHNICIAN
    }

    UserEntity ||--|| UserRoleEnum : contains

    ' --- DTOs for Login & Unverified User OTP ---
    package "DTOs" {
      class LoginRequestDTO <<DTO>> {
        - identifier: String
        - password: String
      }

      class AuthResponseDTO <<DTO>> {
        - token: String
        - userId: Integer
        - username: String
        - role: String
        - isVerified: Boolean
        - status: String
      }
      
      class VerifyOtpRequestDTO <<DTO>> {
        - email: String
        - otp: String
        - type: String
      }

      class ResendOtpRequestDTO <<DTO>> {
        - email: String
        - type: String
      }
    }

    ' --- Backend Components ---
    package "Backend" {
      package "Controllers" {
        class AuthController <<Controller>> {
          + login(dto: LoginRequestDTO): ResponseEntity<AuthResponseDTO>
        }
        class UserController <<Controller>> {
            + resendOtp(dto: ResendOtpRequestDTO): ResponseEntity 
            + verifyOtp(dto: VerifyOtpRequestDTO): ResponseEntity
        }
      }

      package "Services" {
        class AuthService <<Service>> {
          + authenticate(dto: LoginRequestDTO): AuthResponseDTO
        }

        class UserService <<Service>> {
          + resendOtp(dto: ResendOtpRequestDTO): void
          + verifyOtp(dto: VerifyOtpRequestDTO): void
          ' + findByEmail(email: String): Optional<UserEntity>
        }

        class OtpService <<Service>> {
          + generateOtp(email: String): String
          + validateOtp(email: String, otp: String): boolean
        }

        class EmailService <<Service>> {
          + sendOtpEmail(to: String, otp: String): void
        }
      }

      package "Repositories" {
        interface UserRepository <<Repository>> {
          + findByEmail(email: String): Optional<UserEntity>
          + findByUsername(username: String): Optional<UserEntity>
        }
      }

      package "Utils" {
        interface PasswordEncoder <<Utility>> {
          + matches(rawPass: String, encodedPass: String): boolean
          + encode(password: String): String
        }
        class JwtUtil <<Utility>> {
          + {static} generateToken(username: String, userId: Integer, role: String, status: String): String
          + {static} validateToken(token: String): Boolean
          + {static} getUsernameFromToken(token: String): String 
        }
         class EmailUtil <<Utility>> {
            + {static} sendEmail(to: String, subject: String, htmlBody: String): void
        }
      }
    }

    ' --- Relationships ---
    ' Controller to Service
    AuthController --> AuthService : uses
    UserController --> UserService : uses (for OTP flow)

    ' AuthService Core Interactions
    AuthService --> UserRepository : queries
    AuthService ..> UserEntity : reads data
    AuthService --> PasswordEncoder : uses for matching
    AuthService --> JwtUtil : uses for token generation
    AuthService ..> UserService : retrieves user details / status

    ' UserService Interactions for Unverified Login OTP Flow
    UserService --> OtpService : uses for OTP
    UserService --> EmailService : uses for notifications
    UserService --> UserRepository : (potentially if fetching user for OTP flow)

    ' EmailService to EmailUtil (if applicable)
    EmailService --> EmailUtil : delegates sending

    ' Controller uses DTOs
    AuthController ..> LoginRequestDTO : accepts
    AuthService ..> AuthResponseDTO : returns
    UserController ..> ResendOtpRequestDTO : accepts (for OTP)
    UserController ..> VerifyOtpRequestDTO : accepts (for OTP)

    @enduml
    ```
  - **Sequence Diagram:**
    ```plantuml
    @startuml
    title User Login Sequence Diagram

    actor User
    participant "LoginPage" as FE_Login <<Boundary>>
    participant "AuthController" as BE_AuthCtrl <<Controller>>
    participant "AuthService" as BE_AuthSvc <<Service>>
    participant "UserService" as BE_UserSvc <<Service>>
    participant "UserRepository" as BE_UserRepo <<Repository>>
    participant "PasswordEncoder" as BE_PassEnc <<Utility>>
    participant "JwtUtil" as BE_JwtUtil <<Utility>>
    participant "OtpService" as BE_OtpSvc <<Service>>
    participant "EmailService" as BE_EmailSvc <<Service>>
    database Database

    User -> FE_Login : Enters username/email & password, submits
    FE_Login -> BE_AuthCtrl : POST /auth/login (LoginRequestDTO)
    activate BE_AuthCtrl
    BE_AuthCtrl -> BE_AuthSvc : authenticate(loginReqDTO)
    activate BE_AuthSvc

    BE_AuthSvc -> BE_UserRepo : findByEmail() or findByUsername()
    activate BE_UserRepo
    BE_UserRepo -> Database : Query user
    Database --> BE_UserRepo : User record (or null)
    BE_UserRepo --> BE_AuthSvc : Optional<UserEntity>
    deactivate BE_UserRepo

    alt User not found or status inactive
      BE_AuthSvc --> BE_AuthCtrl : Throws AuthenticationException
      BE_AuthCtrl --> FE_Login : HTTP 401/403 Unauthorized
      FE_Login --> User : Displays "Invalid credentials" or "Account inactive"
    else User found and active
      BE_AuthSvc -> BE_PassEnc : matches(rawPassword, storedHash)
      activate BE_PassEnc
      BE_PassEnc --> BE_AuthSvc : boolean (passwordMatch)
      deactivate BE_PassEnc

      alt Password does not match
        BE_AuthSvc --> BE_AuthCtrl : Throws AuthenticationException
        BE_AuthCtrl --> FE_Login : HTTP 401 Unauthorized
        FE_Login --> User : Displays "Invalid credentials"
        note right of FE_Login : Increment failed login attempts
        alt Failed attempts >= 5
          FE_Login --> FE_Login : Disable login button (1 min)
        end
      else Password matches
        alt User not verified (userEntity.isVerified == false)
          BE_AuthSvc --> BE_AuthCtrl : AuthResponseDTO (token, role, isVerified=false, status) ' Token might be null or a temporary one
          BE_AuthCtrl --> FE_Login : HTTP 200 OK (AuthResponseDTO)
          deactivate BE_AuthSvc
          deactivate BE_AuthCtrl
          FE_Login --> User : Displays "Account not verified"
          FE_Login -> BE_UserCtrl : POST /user/resendOtp (email, type=REGISTRATION) ' UserController from 1.1
          activate BE_UserCtrl
          note right of BE_UserCtrl : UserController handles /user/resendOtp
          BE_UserCtrl -> BE_UserSvc : resendOtp(ResendOtpRequestDTO)
          activate BE_UserSvc
          BE_UserSvc -> BE_OtpSvc : generateOtp(email)
          BE_UserSvc ->> BE_EmailSvc : sendOtpEmail(email, otp)
          activate BE_EmailSvc
          BE_EmailSvc -->> BE_UserSvc : ack
          deactivate BE_EmailSvc
          BE_UserSvc --> BE_UserCtrl : void
          deactivate BE_UserSvc
          BE_UserCtrl --> FE_Login : HTTP 200 OK
          deactivate BE_UserCtrl
          FE_Login --> User : Shows OTP Modal (handled as in Registration)
        else User is verified
          BE_AuthSvc -> BE_JwtUtil : generateToken(username, role, etc.)
          activate BE_JwtUtil
          BE_JwtUtil --> BE_AuthSvc : jwtToken
          deactivate BE_JwtUtil
          BE_AuthSvc --> BE_AuthCtrl : AuthResponseDTO (token, role, isVerified=true, status)
          deactivate BE_AuthSvc
          BE_AuthCtrl --> FE_Login : HTTP 200 OK (AuthResponseDTO)
          deactivate BE_AuthCtrl
          FE_Login --> FE_Login : Store token, userRole
          FE_Login --> User : Redirect to role-based dashboard
        end
      end
    end
    @enduml
    ```
- **Data Design:**
  - No changes to ERD from 1.1 for User Login. Login operations primarily read from the `UserEntity`.

### 1.3 Password Reset
- **User Interface Design:**
  - The password reset flow is initiated from the `LoginPage.jsx` via a "Forgot Password" link/button. This triggers the `ForgotPasswordModal`, prompting the user for their registered email. Upon submission, an OTP is sent to the email. The UI then transitions to the `OTPModal` (configured for password reset, type=PASSWORD_RESET) for OTP input. Successful OTP verification leads to the `NewPasswordModal`, where the user can set and confirm their new password. Visual feedback (`Spinner`) and status messages (`Toast`) are used throughout the multi-step modal process to guide the user.
- **Front-end component(s):**
  - **Component Name:** `LoginPage.jsx`
    - *Description and purpose:* Hosts the modals (`ForgotPasswordModal`, `OTPModal`, `NewPasswordModal`) required for the password reset flow. Initiates the process.
    - *Component type or format:* React Functional Component
  - **Component Name:** `ForgotPasswordModal`
    - *Description and purpose:* Captures the user's email address to initiate the password reset process and request an OTP.
    - *Component type or format:* React Functional Component Modal
  - **Component Name:** `OTPModal`
    - *Description and purpose:* Prompts the user to enter the OTP received via email. Configured for password reset (distinguished by a 'type' parameter, e.g., type=PASSWORD_RESET). Handles OTP submission and resend requests.
    - *Component type or format:* React Functional Component Modal
  - **Component Name:** `NewPasswordModal`
    - *Description and purpose:* Allows the user to enter and confirm their new password after successful OTP verification.
    - *Component type or format:* React Functional Component Modal
  - **Component Name:** `Spinner`
    - *Description and purpose:* Reusable visual indicator for loading states during API calls (e.g., sending OTP, verifying OTP, resetting password).
    - *Component type or format:* React Functional Component
  - **Component Name:** `Toast`
    - *Description and purpose:* Displays brief messages for success or error feedback (e.g., "OTP sent", "Invalid OTP", "Password reset successfully").
    - *Component type or format:* React Functional Component
- **Back-end component(s):**
  - **Component Name:** `UserController.java`
    - *Description and purpose:* Handles HTTP requests for password reset. Endpoints include: `/user/forgotPassword` to initiate reset, `/user/verifyOtp` (with type=PASSWORD_RESET for password reset context) to validate OTP, `/user/resetPassword` to set the new password, and `/user/resendOtp` (with type=PASSWORD_RESET) to request a new OTP for password reset.
    - *Component type or format:* Spring `@RestController`
  - **Component Name:** `UserService.java`
    - *Description and purpose:* Contains core business logic for password reset. Methods include: `forgotPassword` (generates OTP, sends email), `verifyOtp` (validates OTP for type PASSWORD_RESET), `resetPassword` (validates new password, updates user record), and `resendOtp` (for type PASSWORD_RESET).
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `UserEntity.java`
    - *Description and purpose:* Represents the user data model; password field is updated during reset. (As defined in 1.1)
    - *Component type or format:* JPA `@Entity`
  - **Component Name:** `ForgotPasswordRequestDTO.java`
    - *Description and purpose:* DTO carrying the user's email to initiate the password reset process.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `ResetPasswordRequestDTO.java`
    - *Description and purpose:* DTO carrying the user's email, new password, and confirmed new password for the final step of password reset.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `VerifyOtpRequestDTO.java`
    - *Description and purpose:* DTO for OTP verification, used with `type=PASSWORD_RESET` to signify password reset context. (As defined in 1.1)
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `ResendOtpRequestDTO.java`
    - *Description and purpose:* DTO for resending OTP, used with `type=PASSWORD_RESET` for password reset. (As defined in 1.1)
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `OtpService.java`
    - *Description and purpose:* Manages OTP generation, storage, and validation specifically for password reset requests. (As defined in 1.1, but contextually for type=PASSWORD_RESET)
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `EmailService.java`
    - *Description and purpose:* Responsible for sending the password reset OTP email via its `sendForgotPasswordEmail` method. (Method added or specialized within this service)
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `PasswordEncoder`
    - *Description and purpose:* Used to hash the new password before updating it in the `UserEntity`. (As defined in 1.1)
    - *Component type or format:* Spring Security interface/component
  - **Component Name:** `UserRepository.java`
    - *Description and purpose:* Used to fetch the user by email and to save the `UserEntity` with the updated password. (As defined in 1.1)
    - *Component type or format:* Spring Data JPA Repository Interface
- **Object-Oriented Components:**
  - **Class Diagram:**
    ```plantuml
    @startuml
    title Class Diagram - Password Reset

    !define MIXING
    allowmixing
    top to bottom direction

    ' --- Entities ---
    class UserEntity <<Entity>> {
      - userId: Integer
      - email: String
      - password: String
    }

    ' --- DTOs for Password Reset ---
    package "DTOs" {
      class ForgotPasswordRequestDTO <<DTO>> {
        - email: String
      }

      class VerifyOtpRequestDTO <<DTO>> {
        - email: String
        - otp: String
        - type: String
      }
      
      class ResendOtpRequestDTO <<DTO>> {
        - email: String
        - type: String
      }

      class ResetPasswordRequestDTO <<DTO>> {
        - email: String
        - newPassword: String
        - confirmPassword: String
      }
    }

    ' --- Backend Components ---
    package "Backend" {
      package "Controllers" {
        class UserController <<Controller>> {
          + forgotPassword(dto: ForgotPasswordRequestDTO): ResponseEntity
          + verifyOtp(dto: VerifyOtpRequestDTO): ResponseEntity
          + resendOtp(dto: ResendOtpRequestDTO): ResponseEntity
          + resetPassword(dto: ResetPasswordRequestDTO): ResponseEntity
        }
      }

      package "Services" {
        class UserService <<Service>> {
          + forgotPassword(dto: ForgotPasswordRequestDTO): void
          + verifyOtp(dto: VerifyOtpRequestDTO): void
          + resendOtp(dto: ResendOtpRequestDTO): void
          + resetPassword(dto: ResetPasswordRequestDTO): void
        }

        class OtpService <<Service>> {
          + generateOtp(email: String): String
          + validateOtp(email: String, otp: String): boolean
        }

        class EmailService <<Service>> {
          + sendForgotPasswordEmail(to: String, otp: String): void
        }
      }

      package "Repositories" {
        interface UserRepository <<Repository>> {
          + findByEmail(email: String): Optional<UserEntity>
          + save(userEntity: UserEntity): UserEntity
        }
      }

      package "Utils" {
        interface PasswordEncoder <<Utility>> {
          + encode(password: String): String
        }
        class EmailUtil <<Utility>> {
            + {static} sendEmail(to: String, subject: String, htmlBody: String): void
        }
      }
    }

    ' --- Relationships ---
    ' Controller to Service
    UserController --> UserService : uses

    ' UserService Core Interactions
    UserService --> UserRepository : queries/updates
    UserService ..> UserEntity : updates password
    UserService --> OtpService : uses for OTP
    UserService --> EmailService : uses for notifications
    UserService --> PasswordEncoder : uses for hashing new password

    ' EmailService to EmailUtil (if applicable)
    EmailService --> EmailUtil : delegates sending

    ' Controller uses DTOs
    UserController ..> ForgotPasswordRequestDTO : accepts
    UserController ..> VerifyOtpRequestDTO : accepts
    UserController ..> ResendOtpRequestDTO : accepts
    UserController ..> ResetPasswordRequestDTO : accepts

    @enduml
    ```
  - **Sequence Diagram:**
    ```plantuml
    @startuml
    title Password Reset Sequence Diagram

    actor User
    participant "LoginPageModals" as FE_Modals <<Modal>>
    note left of FE_Modals : ForgotPasswordModal, OTPModal, NewPasswordModal hosted by LoginPage.jsx
    
    participant "UserController" as BE_UserCtrl <<Controller>>
    participant "UserService" as BE_UserSvc <<Service>>
    participant "OtpService" as BE_OtpSvc <<Service>>
    participant "EmailService" as BE_EmailSvc <<Service>>
    participant "UserRepository" as BE_UserRepo <<Repository>>
    participant "PasswordEncoder" as BE_PassEnc <<Utility>>
    database Database

    User -> FE_Modals : Clicks "Forgot Password"
    FE_Modals -> FE_Modals : Shows ForgotPasswordModal
    User -> FE_Modals : Enters email, submits
    FE_Modals -> BE_UserCtrl : POST /user/forgotPassword (ForgotPasswordRequestDTO)
    activate BE_UserCtrl
    BE_UserCtrl -> BE_UserSvc : forgotPassword(reqDTO)
    activate BE_UserSvc

    BE_UserSvc -> BE_UserRepo : findByEmail(email)
    activate BE_UserRepo
    BE_UserRepo --> BE_UserSvc : Optional<UserEntity>
    deactivate BE_UserRepo

    alt Email not found
      BE_UserSvc --> BE_UserCtrl : Throws Exception ("User not found")
      BE_UserCtrl --> FE_Modals : HTTP 404 Not Found
      FE_Modals --> User : Displays "Email not found"
    else Email found
      BE_UserSvc -> BE_OtpSvc : generateOtp(email)
      activate BE_OtpSvc
      BE_OtpSvc --> BE_UserSvc : otpValue
      deactivate BE_OtpSvc

      BE_UserSvc ->> BE_EmailSvc : sendForgotPasswordEmail(email, otpValue)
      activate BE_EmailSvc
      BE_EmailSvc -->> BE_UserSvc : ack
      deactivate BE_EmailSvc
      
      BE_UserSvc --> BE_UserCtrl : void
      deactivate BE_UserSvc
      BE_UserCtrl --> FE_Modals : HTTP 200 OK
      deactivate BE_UserCtrl
      FE_Modals -> FE_Modals : Shows OTPModal
    end

    User -> FE_Modals : Enters OTP, submits
    FE_Modals -> BE_UserCtrl : POST /user/verifyOtp (VerifyOtpRequestDTO with type=PASSWORD_RESET)
    activate BE_UserCtrl
    BE_UserCtrl -> BE_UserSvc : verifyOtp(verifyReqDTO)
    activate BE_UserSvc

    BE_UserSvc -> BE_OtpSvc : validateOtp(email, otp)
    activate BE_OtpSvc
    BE_OtpSvc --> BE_UserSvc : boolean (isValidOtp)
    deactivate BE_OtpSvc

    alt OTP invalid or expired
      BE_UserSvc --> BE_UserCtrl : Throws Exception ("Invalid OTP")
      deactivate BE_UserSvc
      BE_UserCtrl --> FE_Modals : HTTP 400 Bad Request
      deactivate BE_UserCtrl
      FE_Modals --> User : Displays "Invalid or expired OTP"
      User -> FE_Modals : Optionally clicks "Resend OTP"
      FE_Modals -> BE_UserCtrl : POST /user/resendOtp (ResendOtpRequestDTO with type=PASSWORD_RESET)
      ' ... similar flow to initial send ...
    else OTP valid
      BE_UserSvc --> BE_UserCtrl : void (OTP verified for password reset)
      deactivate BE_UserSvc
      BE_UserCtrl --> FE_Modals : HTTP 200 OK
      deactivate BE_UserCtrl
      FE_Modals -> FE_Modals : Shows NewPasswordModal
    end
    
    User -> FE_Modals : Enters new password & confirmation, submits
    FE_Modals -> BE_UserCtrl : POST /user/resetPassword (ResetPasswordRequestDTO)
    activate BE_UserCtrl
    BE_UserCtrl -> BE_UserSvc : resetPassword(resetReqDTO)
    activate BE_UserSvc

    BE_UserSvc -> BE_UserRepo : findByEmail(email) ' Ensure user still exists
    activate BE_UserRepo
    BE_UserRepo --> BE_UserSvc : Optional<UserEntity>
    deactivate BE_UserRepo
    
    alt User found
        BE_UserSvc -> BE_PassEnc : encode(newPassword)
        activate BE_PassEnc
        BE_PassEnc --> BE_UserSvc : hashedPassword
        deactivate BE_PassEnc
        
        BE_UserSvc -> BE_UserSvc : Update UserEntity with hashedPassword
        BE_UserSvc -> BE_UserRepo : save(UserEntity)
        activate BE_UserRepo
        BE_UserRepo -> Database : Update user password
        Database --> BE_UserRepo : void
        BE_UserRepo --> BE_UserSvc : Updated UserEntity
        deactivate BE_UserRepo
        
        note right of BE_UserSvc : SRS: Invalidate existing sessions (JWTs). This would require additional logic, e.g., a token blacklist or versioning. Not explicitly in current code snippets.

        BE_UserSvc --> BE_UserCtrl : void (password reset success)
        deactivate BE_UserSvc
        BE_UserCtrl --> FE_Modals : HTTP 200 OK
        deactivate BE_UserCtrl
        FE_Modals --> User : Displays "Password reset successful", redirects to Login
    else User not found (edge case)
        BE_UserSvc --> BE_UserCtrl : Throws Exception ("User not found")
        deactivate BE_UserSvc
        BE_UserCtrl --> FE_Modals : HTTP 404 Not Found
        deactivate BE_UserCtrl
        FE_Modals --> User : Displays error
    end
    @enduml
    ```
- **Data Design:**
  - No changes to ERD from 1.1 for Password Reset. Operations involve reading and updating the `UserEntity`.

### 1.4 User Role and Account Management
- **User Interface Design:**
  - This functionality is primarily for administrators. The `UserManagement.jsx` page provides an admin-facing interface to view, manage, and modify user accounts. It typically includes a table or list view of all registered users, displaying key information like username, email, role, and status (e.g., Active, Inactive). Administrators can perform actions such as changing a user's role (e.g., from CUSTOMER to TECHNICIAN), updating their account status (activating/deactivating), and potentially deleting users. The interface will use clear visual cues (icons, buttons) and confirmation dialogs for critical actions like role changes, status updates, or deletions to prevent accidental modifications. The `Sidebar.jsx` component provides navigation to this management page.
- **Front-end component(s):**
  - **Component Name:** `UserManagement.jsx`
    - *Description and purpose:* Provides the main UI for administrators to manage user accounts. Displays a list of users and offers controls for changing roles, updating statuses, and deleting users.
    - *Component type or format:* React Functional Component
  - **Component Name:** `Sidebar.jsx`
    - *Description and purpose:* A navigation component that provides links to different administrative sections, including the User Management page.
    - *Component type or format:* React Functional Component
  - **Component Name:** `lucide-react` icons (e.g., `Users`, `Edit`, `Trash2`, `ToggleLeft`, `ToggleRight`)
    - *Description and purpose:* Used to provide intuitive visual cues for actions like viewing users, editing roles, deleting accounts, and changing status.
    - *Component type or format:* SVG icons imported as React components.
- **Back-end component(s):**
  - **Component Name:** `UserController.java`
    - *Description and purpose:* Handles HTTP requests related to administrative user management. Endpoints include `/user/getAllUsers` (GET) to list all users, `/user/changeRole/{id}` (PATCH) to modify a user's role, `/user/updateStatus/{id}` (PATCH) to change account status (e.g., active/inactive), and `/user/deleteUser/{id}` (DELETE) to remove a user. These endpoints are protected and accessible only by administrators.
    - *Component type or format:* Spring `@RestController`
  - **Component Name:** `UserService.java`
    - *Description and purpose:* Contains the business logic for user management operations. Methods include `getAllUsers()`, `changeRole(userId, newRole)`, `updateStatus(userId, newStatus)`, and `deleteUser(userId)`. These methods interact with `UserRepository` to persist changes.
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `UserEntity.java`
    - *Description and purpose:* The JPA entity representing user data. Its `role` and `status` fields are modified by these management operations. (As defined in 1.1)
    - *Component type or format:* JPA `@Entity`
  - **Component Name:** `UserRoleEnum.java`
    - *Description and purpose:* Defines the possible roles a user can have (e.g., `ADMIN`, `CUSTOMER`, `TECHNICIAN`). Used in `UserEntity` and for validating role changes.
    - *Component type or format:* Java Enum
  - **Component Name:** `ChangeRoleRequestDTO.java`
    - *Description and purpose:* A DTO used to carry the new role information when an admin changes a user's role. Typically contains the `userId` (as path variable) and the `newRole` (enum value).
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `UpdateUserStatusRequestDTO.java`
    - *Description and purpose:* A DTO used to carry the new status information (e.g., "Active", "Inactive") when an admin updates a user's account status. Contains `userId` (path variable) and `newStatus`.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `GetUserResponseDTO.java`
    - *Description and purpose:* A DTO used to return user information to the client, especially for listing users in the admin management page. Excludes sensitive data like passwords.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `UserRepository.java`
    - *Description and purpose:* Provides data access methods for `UserEntity`, used to fetch users and persist changes to their roles or statuses. (As defined in 1.1)
    - *Component type or format:* Spring Data JPA Repository Interface
  - **Component Name:** `JwtRequestFilter.java` / `SecurityConfig.java`
    - *Description and purpose:* Spring Security components responsible for ensuring that only authenticated users with the appropriate administrative roles can access the user management endpoints. `JwtRequestFilter` validates the JWT, and `SecurityConfig` defines authorization rules (e.g., `@PreAuthorize("hasRole('ADMIN')")` or antMatcher rules).
    - *Component type or format:* Spring Security Filter / Configuration
- **Object-Oriented Components:**
  - **Class Diagram:**
    ```plantuml
    @startuml
    title Class Diagram - User Role and Account Management

    !define MIXING
    allowmixing
    top to bottom direction

    ' --- Entities & Enums ---
    class UserEntity <<Entity>> {
      - userId: Integer
      - username: String
      - email: String
      - role: UserRoleEnum
      - status: String
      - firstName: String
      - lastName: String
      - phoneNumber: String
      - isVerified: Boolean
      - createdAt: LocalDateTime
    }

    enum UserRoleEnum {
      ADMIN
      CUSTOMER
      TECHNICIAN
    }

    UserEntity ||--|| UserRoleEnum : contains

    ' --- DTOs for User Management ---
    package "DTOs" {
      class GetUserResponseDTO <<DTO>> {
        - userId: Integer
        - username: String
        - email: String
        - firstName: String
        - lastName: String
        - role: String
        - status: String
        - phoneNumber: String
        - isVerified: Boolean
        - createdAt: LocalDateTime
      }

      class ChangeRoleRequestDTO <<DTO>> {
        - newRole: String
      }

      class UpdateUserStatusRequestDTO <<DTO>> {
        - newStatus: String
      }
    }

    ' --- Backend Components ---
    package "Backend" {
      package "Controllers" {
        class UserController <<Controller>> {
          + getAllUsers(): ResponseEntity<List<GetUserResponseDTO>>
          + changeRole(userId: Integer, dto: ChangeRoleRequestDTO): ResponseEntity
          + updateUserStatus(userId: Integer, dto: UpdateUserStatusRequestDTO): ResponseEntity
          + deleteUser(userId: Integer): ResponseEntity
        }
      }

      package "Services" {
        class UserService <<Service>> {
          + getAllUsers(): List<GetUserResponseDTO>
          + changeRole(userId: Integer, newRole: String): void 
          + updateStatus(userId: Integer, newStatus: String): void
          + deleteUser(userId: Integer): void
        }
      }

      package "Repositories" {
        interface UserRepository <<Repository>> {
          + findById(userId: Integer): Optional<UserEntity>
          + findAll(): List<UserEntity>
          + save(userEntity: UserEntity): UserEntity
          + delete(userEntity: UserEntity): void
          + deleteById(userId: Integer): void
        }
      }
    }

    ' --- Relationships ---
    ' Controller to Service
    UserController --> UserService : uses

    ' Service to Repository & Entity
    UserService --> UserRepository : manages
    UserService ..> UserEntity : reads/updates/deletes 

    ' Controller uses/returns DTOs
    UserController ..> ChangeRoleRequestDTO : accepts
    UserController ..> UpdateUserStatusRequestDTO : accepts
    UserService ..> GetUserResponseDTO : returns 

    @enduml
    ```
  - **Sequence Diagram:**
    ```plantuml
    @startuml
    title User Role and Account Management (Admin - Role Change Example)

    actor Admin
    participant "UserManagementPage" as FE_AdminPage <<Page>>
    participant "UserController" as BE_UserCtrl <<Controller>>
    participant "UserService" as BE_UserSvc <<Service>>
    participant "UserRepository" as BE_UserRepo <<Repository>>
    database Database

    Admin -> FE_AdminPage : Navigates to User Management
    FE_AdminPage -> BE_UserCtrl : GET /user/getAllUsers
    activate BE_UserCtrl
    BE_UserCtrl -> BE_UserSvc : getAllUsers()
    activate BE_UserSvc
    BE_UserSvc -> BE_UserRepo : findAll()
    activate BE_UserRepo
    BE_UserRepo -> Database : Query all users
    Database --> BE_UserRepo : List<UserEntity>
    BE_UserRepo --> BE_UserSvc : List<UserEntity>
    deactivate BE_UserRepo
    BE_UserSvc -> BE_UserSvc : Map List<UserEntity> to List<GetUserResponseDTO>
    BE_UserSvc --> BE_UserCtrl : List<GetUserResponseDTO>
    deactivate BE_UserSvc
    BE_UserCtrl --> FE_AdminPage : HTTP 200 OK (List of users)
    deactivate BE_UserCtrl
    FE_AdminPage --> Admin : Displays list of users

    Admin -> FE_AdminPage : Selects a user, chooses new role, and saves
    FE_AdminPage -> BE_UserCtrl : PATCH /user/changeRole/{userId} (ChangeRoleRequestDTO)
    activate BE_UserCtrl
    BE_UserCtrl -> BE_UserSvc : changeRole(userId, newRole)
    activate BE_UserSvc

    BE_UserSvc -> BE_UserRepo : findById(userId)
    activate BE_UserRepo
    BE_UserRepo -> Database : Query user by ID
    Database --> BE_UserRepo : UserEntity
    BE_UserRepo --> BE_UserSvc : Optional<UserEntity>
    deactivate BE_UserRepo
    
    alt User found
      BE_UserSvc -> BE_UserSvc : Perform validation (e.g., not last admin demoting self)
      BE_UserSvc -> BE_UserSvc : Update UserEntity.setRole(newRole)
      BE_UserSvc -> BE_UserRepo : save(UserEntity)
      activate BE_UserRepo
      BE_UserRepo -> Database : Update user role
      Database --> BE_UserRepo : Updated UserEntity
      BE_UserRepo --> BE_UserSvc : Updated UserEntity
      deactivate BE_UserRepo
      BE_UserSvc --> BE_UserCtrl : void (role changed successfully)
      deactivate BE_UserSvc
      BE_UserCtrl --> FE_AdminPage : HTTP 200/204 OK (Success)
      deactivate BE_UserCtrl
      FE_AdminPage --> FE_AdminPage : Refresh user list or update UI
      FE_AdminPage --> Admin : Displays "Role updated successfully"
    else User not found or validation fails
      BE_UserSvc --> BE_UserCtrl : Throws Exception (e.g., "User not found", "Cannot demote last admin")
      deactivate BE_UserSvc
      BE_UserCtrl --> FE_AdminPage : HTTP 400/404 Error
      deactivate BE_UserCtrl
      FE_AdminPage --> Admin : Displays error message
    end
    
    ' Similar sequence for Update Status:
    ' Admin -> FE_AdminPage : Clicks "Deactivate" for a user
    ' FE_AdminPage -> BE_UserCtrl : PATCH /user/updateStatus/{userId} (UpdateUserStatusRequestDTO with status="Inactive")
    ' BE_UserCtrl -> BE_UserSvc : updateStatus(userId, "Inactive")
    ' ... (UserService updates status and saves via UserRepository) ...
    ' BE_UserCtrl --> FE_AdminPage : Success/Error
    ' FE_AdminPage --> Admin : UI Update / Message
    
    @enduml
    ```
- **Data Design:**
  - No fundamental changes to ERD from 1.1. Operations involve updating the `role` (of type `UserRoleEnum`) and `status` fields of the `UserEntity`.

### 1.5 User Profile Management
- **User Interface Design:**
  - Users can manage their own profiles via an `AccountInformationPage.jsx`, accessible through the `Sidebar.jsx`. This page displays their current information (first name, last name, username, email, phone number). An "Edit Profile" button or similar will trigger an `EditProfileModal`. Within this modal, users can update their first name, last name, username, and phone number. A separate section or modal, possibly `ChangePasswordModal`, will allow users to change their password, requiring them to enter their current password and then a new password with confirmation. The UI will provide clear feedback on successful updates or errors using `Toast` messages and `Spinner` components for loading states.
- **Front-end component(s):**
  - **Component Name:** `AccountInformationPage.jsx`
    - *Description and purpose:* Displays the current user's profile information and provides entry points (e.g., buttons) to edit profile details or change password.
    - *Component type or format:* React Functional Component
  - **Component Name:** `Sidebar.jsx`
    - *Description and purpose:* Provides navigation to the `AccountInformationPage`. (As defined in 1.4)
    - *Component type or format:* React Functional Component
  - **Component Name:** `EditProfileModal` (or inline editing on `AccountInformationPage.jsx`)
    - *Description and purpose:* A modal or form section allowing users to update their full name, username, and phone number.
    - *Component type or format:* React Functional Component (Modal or part of Page)
  - **Component Name:** `ChangePasswordModal` (or similar, could be part of `EditProfileModal`)
    - *Description and purpose:* A modal or form section for users to change their current password. Requires current password, new password, and confirmation.
    - *Component type or format:* React Functional Component (Modal)
  - **Component Name:** `Spinner` (As defined in 1.1)
  - **Component Name:** `Toast` (As defined in 1.2)
- **Back-end component(s):**
  - **Component Name:** `UserController.java`
    - *Description and purpose:* Handles HTTP requests for the current user to manage their own profile. Endpoints include:
      - `/user/getCurrentUser` (GET): To fetch current user's details.
      - `/user/updateCurrentUserFullName` (PATCH): To update first and last name.
      - `/user/updateCurrentUserUsername` (PATCH): To update username (may require re-authentication or specific handling due to its use in login).
      - `/user/changeCurrentUserPhoneNumber` (PATCH): To update phone number.
      - `/user/changeCurrentUserPassword` (PATCH): To change current user's password.
      All endpoints are protected and operate on the authenticated user's context.
    - *Component type or format:* Spring `@RestController`
  - **Component Name:** `UserService.java`
    - *Description and purpose:* Contains business logic for current user profile updates. Methods include: `getCurrentUserDto()`, `updateCurrentUserFullName(UpdateFullNameRequestDTO)`, `updateCurrentUserUsername(UpdateUsernameRequestDTO)`, `changeCurrentUserPhoneNumber(ChangePhoneNumberDTO)`, `changeCurrentUserPassword(ChangeCurrentUserPasswordRequestDTO)`. These methods fetch the authenticated user, validate data, and update the `UserEntity` via `UserRepository`.
    - *Component type or format:* Spring `@Service`
  - **Component Name:** `UserEntity.java` (As defined in 1.1)
    - *Description and purpose:* The user's record is updated by these operations.
    - *Component type or format:* JPA `@Entity`
  - **Component Name:** `UpdateFullNameRequestDTO.java`
    - *Description and purpose:* DTO for updating the user's first and last name.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `UpdateUsernameRequestDTO.java`
    - *Description and purpose:* DTO for updating the user's username.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `ChangePhoneNumberDTO.java`
    - *Description and purpose:* DTO for updating the user's phone number.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `ChangeCurrentUserPasswordRequestDTO.java`
    - *Description and purpose:* DTO for changing the current user's password. Includes current password, new password, and confirmation.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `GetUserResponseDTO.java` (As defined in 1.4)
    - *Description and purpose:* Used to return the current user's profile data.
    - *Component type or format:* Java Class/POJO
  - **Component Name:** `PasswordEncoder` (As defined in 1.1)
    - *Description and purpose:* Used to verify the current password and hash the new password during a password change.
    - *Component type or format:* Spring Security interface/component
  - **Component Name:** `UserRepository.java` (As defined in 1.1)
    - *Description and purpose:* Used to fetch and save the updated `UserEntity`.
    - *Component type or format:* Spring Data JPA Repository Interface
- **Object-Oriented Components:**
  - **Class Diagram:**
    ```plantuml
    @startuml
    title Class Diagram - User Profile Management

    !define MIXING
    allowmixing
    top to bottom direction

    ' --- Entities ---
    class UserEntity <<Entity>> {
      - userId: Integer
      - username: String
      - password: String
      - email: String 
      - firstName: String
      - lastName: String
      - phoneNumber: String
      - role: UserRoleEnum 
      - status: String
      - isVerified: Boolean
      - createdAt: LocalDateTime
    }

    enum UserRoleEnum {
      ADMIN
      CUSTOMER
      TECHNICIAN
    }
    UserEntity ||--|| UserRoleEnum : contains


    ' --- DTOs for User Profile Management ---
    package "DTOs" {
      class GetUserResponseDTO <<DTO>> {
        - userId: Integer
        - username: String
        - email: String
        - firstName: String
        - lastName: String
        - role: String
        - status: String
        - phoneNumber: String
        - isVerified: Boolean
        - createdAt: LocalDateTime
      }

      class UpdateFullNameRequestDTO <<DTO>> {
        - firstName: String
        - lastName: String
      }

      class UpdateUsernameRequestDTO <<DTO>> {
        - newUsername: String
      }

      class ChangePhoneNumberDTO <<DTO>> {
        - newPhoneNumber: String
      }

      class ChangeCurrentUserPasswordRequestDTO <<DTO>> {
        - currentPassword: String
        - newPassword: String
        - confirmNewPassword: String
      }
    }

    ' --- Backend Components ---
    package "Backend" {
      package "Controllers" {
        class UserController <<Controller>> {
          + getCurrentUser(): ResponseEntity<GetUserResponseDTO>
          + updateCurrentUserFullName(dto: UpdateFullNameRequestDTO): ResponseEntity
          + updateCurrentUserUsername(dto: UpdateUsernameRequestDTO): ResponseEntity
          + changeCurrentUserPhoneNumber(dto: ChangePhoneNumberDTO): ResponseEntity
          + changeCurrentUserPassword(dto: ChangeCurrentUserPasswordRequestDTO): ResponseEntity
        }
      }

      package "Services" {
        class UserService <<Service>> {
          + getCurrentUserDto(): GetUserResponseDTO
          + updateCurrentUserFullName(dto: UpdateFullNameRequestDTO): void
          + updateCurrentUserUsername(dto: UpdateUsernameRequestDTO): void
          + changeCurrentUserPhoneNumber(dto: ChangePhoneNumberDTO): void
          + changeCurrentUserPassword(dto: ChangeCurrentUserPasswordRequestDTO): void
        }
      }

      package "Repositories" {
        interface UserRepository <<Repository>> {
          + findById(userId: Integer): Optional<UserEntity> 
          + save(userEntity: UserEntity): UserEntity
        }
      }

      package "Utils" {
        interface PasswordEncoder <<Utility>> {
          + encode(password: String): String
          + matches(rawPass: String, encodedPass: String): boolean
        }
      }
    }

    ' --- Relationships ---
    ' Controller to Service
    UserController --> UserService : uses

    ' Service to Repository & Entity
    UserService --> UserRepository : manages
    UserService ..> UserEntity : reads/updates 

    ' Service to Utils
    UserService --> PasswordEncoder : uses for password operations

    ' Controller uses/returns DTOs
    UserController ..> UpdateFullNameRequestDTO : accepts
    UserController ..> UpdateUsernameRequestDTO : accepts
    UserController ..> ChangePhoneNumberDTO : accepts
    UserController ..> ChangeCurrentUserPasswordRequestDTO : accepts
    UserService ..> GetUserResponseDTO : returns 

    @enduml
    ```
  - **Sequence Diagram:**
    ```plantuml
    @startuml
    title User Profile Management (Name Update Example)

    actor User
    participant "AccountInfoPage" as FE_ProfilePage <<Page>>
    note left of FE_ProfilePage : Includes Edit Profile Modal
    
    participant "UserController" as BE_UserCtrl <<Controller>>
    participant "UserService" as BE_UserSvc <<Service>>
    participant "UserRepository" as BE_UserRepo <<Repository>>
    database Database

    User -> FE_ProfilePage : Navigates to Account Info / Settings
    FE_ProfilePage -> BE_UserCtrl : GET /user/getCurrentUser ' Initial data load
    activate BE_UserCtrl
    BE_UserCtrl -> BE_UserSvc : getCurrentUserDto()
    activate BE_UserSvc
    BE_UserSvc -> BE_UserSvc : Gets authenticated user
    BE_UserSvc -> BE_UserRepo : findByUsername(authUsername)
    activate BE_UserRepo
    BE_UserRepo --> BE_UserSvc : UserEntity
    deactivate BE_UserRepo
    BE_UserSvc -> BE_UserSvc : Maps UserEntity to GetUserResponseDTO
    BE_UserSvc --> BE_UserCtrl : GetUserResponseDTO
    deactivate BE_UserSvc
    BE_UserCtrl --> FE_ProfilePage : HTTP 200 OK (GetUserResponseDTO)
    deactivate BE_UserCtrl
    FE_ProfilePage --> FE_ProfilePage : Displays current profile data
    
    User -> FE_ProfilePage : Clicks "Edit Profile"
    FE_ProfilePage -> FE_ProfilePage : Shows Edit Profile Modal with current data
    User -> FE_ProfilePage : Modifies First Name, Last Name, submits
    
    FE_ProfilePage -> BE_UserCtrl : PATCH /user/updateCurrentUserFullName (UpdateFullNameRequestDTO)
    activate BE_UserCtrl
    BE_UserCtrl -> BE_UserSvc : updateCurrentUserFullName(reqDTO)
    activate BE_UserSvc

    BE_UserSvc -> BE_UserSvc : Gets authenticated user (e.g., from SecurityContextHolder)
    BE_UserSvc -> BE_UserRepo : findByUsername(authUsername) ' or findById
    activate BE_UserRepo
    BE_UserRepo -> Database : Query user
    Database --> BE_UserRepo : UserEntity
    BE_UserRepo --> BE_UserSvc : UserEntity
    deactivate BE_UserRepo
    
    alt User found
      BE_UserSvc -> BE_UserSvc : Updates UserEntity fields (firstName, lastName)
      BE_UserSvc -> BE_UserRepo : save(UserEntity)
      activate BE_UserRepo
      BE_UserRepo -> Database : Update user details
      Database --> BE_UserRepo : Updated UserEntity
      BE_UserRepo --> BE_UserSvc : Updated UserEntity
      deactivate BE_UserRepo
      
      BE_UserSvc --> BE_UserCtrl : void (update successful)
      deactivate BE_UserSvc
      BE_UserCtrl --> FE_ProfilePage : HTTP 200/204 OK
      deactivate BE_UserCtrl
      FE_ProfilePage -> FE_ProfilePage : Updates UI with new data, closes modal
      FE_ProfilePage --> User : Displays "Profile updated successfully"
    else User not found (edge case, should not happen for authenticated user)
      BE_UserSvc --> BE_UserCtrl : Throws Exception
      deactivate BE_UserSvc
      BE_UserCtrl --> FE_ProfilePage : HTTP Error (e.g., 404, 500)
      deactivate BE_UserCtrl
      FE_ProfilePage --> User : Displays error message
    end
    
    ' Similar sequences for username update (may involve re-login), phone update.
    ' Password change would be a separate sequence often involving current password.
    @enduml
    ```
- **Data Design:**
  - No changes to ERD from 1.1. Operations involve updating fields within the existing `UserEntity`.

[end of documentation/SDD_ServIT_Module1_new.md]

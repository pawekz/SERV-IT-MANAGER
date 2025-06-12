# AI Instruction: Generating Standard-Compliant OOP Class Diagrams with PlantUML

## Overview

Generate a precise, UML-compliant class diagram representing backend Object-Oriented Programming (OOP) components from the Software Requirements Specification (SRS). The diagram must explicitly render all methods—including Lombok-generated ones—with complete method signatures. Implement correct PlantUML syntax with proper relationship notation, arrow directionality, and cardinality indicators.

## Technical Requirements

### 1. Class Structure and Identification

- Extract all relevant classes from the SRS document for the specified module or transaction
- Focus exclusively on backend (server-side) components and their OOP relationships
- Group classes into logical packages by functional domain (e.g., Domain, Services, Controllers)
- Apply technical stereotypes for each class type (<<Entity>>, <<Controller>>, <<Service>>, <<Repository>>)
- Define all attributes with precise data types and explicit visibility modifiers (`-` private, `+` public, `#` protected)

### 2. Complete Method Representation

- Render **ALL** methods explicitly in the diagram:
  - All accessor methods (getters/setters) for each attribute
  - All constructors (no-args, parameterized, all-args)
  - Business logic and domain methods
  - Utility and helper methods
  - Overridden methods from parent classes/interfaces
- Even with Lombok annotations (@Data, @Getter, @Setter, etc.), list their generated methods (if it is used, it must be represented)
- Include full method signatures with:
  - Parameter names and types
  - Return types
  - Visibility modifiers:
    - `+` public
    - `-` private
    - `#` protected
    - `~` package/default

### 3. Relationship Modeling

- Implement standard UML relationship types with correct PlantUML syntax:
  | Relationship Type | UML Notation | PlantUML Syntax | Usage |
  |------------------|-------------|----------------|-------|
  | Association | → | `--` or `-->` | Basic relationship between classes |
  | Aggregation | ◇→ | `o--` or `o-->` | "Has-a" relationship (child exists independently) |
  | Composition | ♦→ | `*--` or `*-->` | "Contains" relationship (child's lifecycle depends on parent) |
  | Inheritance | ▷→ | `<|--` | "Is-a" relationship (arrow points to parent) |
  | Implementation | ▷→(dashed) | `<|..` | Interface implementation (arrow points to interface) |
  | Dependency | →(dashed) | `..>` | Temporary usage relationship |
  
- Include multiplicity indicators at relationship endpoints:
  ```
  ClassA "1" --> "many" ClassB : contains >
  ClassC "1" --o "0..*" ClassD : has >
  ```

### 4. PlantUML Technical Configuration

- Use standard PlantUML document structure:
  ```
  @startuml
  title [Descriptive Title]
  
  [diagram content]
  
  @enduml
  ```
- Apply consistent styling parameters:
  ```
  !theme plain
  skinparam style strictuml
  skinparam classAttributeIconSize 0
  skinparam classFontSize 12
  skinparam classStereotypeFontSize 10
  skinparam arrowFontSize 10
  skinparam packageFontSize 14
  skinparam dpi 240
  ```
- Set logical layout with `top to bottom direction` or `left to right direction`
- Group classes into domain-specific packages:
  ```
  package "Domain" {
    // Domain entities and enums
  }
  
  package "Services" {
    // Service interfaces and implementations
  }
  ```

### 5. Lombok Integration Requirements

- Represent Lombok annotations as class stereotypes: `<<@Data>>`, `<<@Getter>>`, `<<@NoArgsConstructor>>`, etc.
- Despite Lombok usage, explicitly list all generated code:
  ```
  class UserEntity <<Entity>> <<@Data>> <<@NoArgsConstructor>> <<@AllArgsConstructor>> {
    - userId: Integer
    - username: String
    
    // Explicitly list all generated methods:
    + getUserId(): Integer
    + setUserId(userId: Integer): void
    + equals(obj: Object): boolean
    + hashCode(): int
    + toString(): String
    + UserEntity()
    + UserEntity(userId: Integer, username: String)
  }
  ```
- Include comments to clarify method origins (e.g., `' Methods from @Data`)

### 6. Parameter Direction Indicators

- For complex method signatures, specify parameter directionality:
  ```
  + methodName(in paramName: Type, out resultParam: Type): ReturnType
  ```
- Apply this notation when parameters serve as both input and output or when the direction isn't obvious

## Output Format Reference

```
@startuml
title Class Diagram - [Module Name]

!theme plain
skinparam style strictuml
skinparam classAttributeIconSize 0
skinparam classFontSize 12
skinparam classStereotypeFontSize 10
skinparam arrowFontSize 10
skinparam packageFontSize 14
skinparam dpi 360

top to bottom direction

// Package and class definitions with full method signatures
// Relationship definitions with proper multiplicity

@enduml
```

## Technical Notes

- Generate a highly detailed diagram that maintains readability
- Use comments to document design decisions and non-obvious relationships
- For large systems, create multiple focused diagrams instead of one complex diagram
- Include all enums with their complete value sets
- When creating the diagram, validate that all Lombok-generated methods are explicitly represented

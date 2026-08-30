# EARS Format Guidelines

## Overview
EARS (Easy Approach to Requirements Syntax) is the standard format for acceptance criteria in spec-driven development.

EARS defines semantic patterns (condition + subject + mandatory response) and is not tied to English. Acceptance criteria must be written entirely in the specification language. Translate both trigger words and the mandatory modal while preserving the logical pattern.

Examples:
- English: `When [event], the [system] shall [response]`.
- Portuguese: `Quando [evento], o [sistema] deve [resposta]`.
- Spanish: `Cuando [evento], el [sistema] debe [respuesta]`.

Do not mix fixed English phrases with localized variable text. Tooling should classify the semantic pattern from the criterion structure and explicit numeric ID, not from English keywords alone.

## Primary EARS Patterns

### 1. Event-Driven Requirements
- **Pattern**: When [event], the [system] shall [response/action]
- **Use Case**: Responses to specific events or triggers
- **Example**: When user clicks checkout button, the Checkout Service shall validate cart contents

### 2. State-Driven Requirements
- **Pattern**: While [precondition], the [system] shall [response/action]
- **Use Case**: Behavior dependent on system state or preconditions
- **Example**: While payment is processing, the Checkout Service shall display loading indicator

### 3. Unwanted Behavior Requirements
- **Pattern**: If [trigger], the [system] shall [response/action]
- **Use Case**: System response to errors, failures, or undesired situations
- **Example**: If invalid credit card number is entered, then the website shall display error message

### 4. Optional Feature Requirements
- **Pattern**: Where [feature is included], the [system] shall [response/action]
- **Use Case**: Requirements for optional or conditional features
- **Example**: Where the car has a sunroof, the car shall have a sunroof control panel

### 5. Ubiquitous Requirements
- **Pattern**: The [system] shall [response/action]
- **Use Case**: Always-active requirements and fundamental system properties
- **Example**: The mobile phone shall have a mass of less than 100 grams

## Combined Patterns
- While [precondition], when [event], the [system] shall [response/action]
- When [event] and [additional condition], the [system] shall [response/action]

## Subject Selection Guidelines
- **Software Projects**: Use concrete system/service name (e.g., "Checkout Service", "User Auth Module")
- **Process/Workflow**: Use responsible team/role (e.g., "Support Team", "Review Process")
- **Non-Software**: Use appropriate subject (e.g., "Marketing Campaign", "Documentation")

## Quality Criteria
- Requirements must be testable, verifiable, and describe a single behavior.
- Use objective language: "shall" for mandatory behavior, "should" for recommendations; avoid ambiguous terms.
- Give every acceptance criterion a stable numeric ID `N.M` derived from its requirement group and local criterion number.
- Follow the localized EARS syntax: [condition], [system], [mandatory response].

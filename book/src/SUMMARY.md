# The Cedar Authorization Policy Language

[The Rust Programming Language](title-page.md)
[Foreword](foreword.md)
[Introduction](ch00-00-introduction.md)

## The Cedar policy language

- Starting from the current docs content, change “what is Cedar?”, especially the Overview, to be more narrative, to step the reader through a TinyTodo-like scenario. Also, make “terms & concepts” useful for reference, but not mandatory; right now, it’s the only place that some important topics are introduced
    - Maybe leverage the TinyTodo tutorial pretty much as is, but perhaps change to use templates, too?
    - Other topics: Templates, policy metadata

## Cedar schemas and validation

- Expressing your authorization model with a Cedar schema
    - Explain using custom syntax
    - Somewhere else: Explain with JSON syntax
- Validating policies against a schema
- Uses for schemas

## Using Cedar in your application

- Three kinds of policies
    - Developer-created
    - App-created
    - Admin-created

- Storing and retrieving policies

- Managing policy-relevant data
    - Mapping application data to Cedar entities

## Authorization design patterns

## Cedar experimental features

- Partial evaluation 
- Alternative validation algorithms
    - Validation with incomplete schemas
    - "Permissive mode" validation

## Case studies

- TinyTodo

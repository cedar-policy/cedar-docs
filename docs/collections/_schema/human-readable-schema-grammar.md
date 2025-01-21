---
layout: default
title: Cedar schema grammar
nav_order: 2
---
<!-- markdownlint-disable-file MD040 -->

# Grammar specification for Cedar schemas {#schema-grammar}
{: .no_toc }

This topic describes the grammar specification for the Cedar schema format. For a more complete description, see [Cedar schema format](../schema/human-readable-schema.html).

The grammar applies the following conventions.
+ Words with initial capital letters designate grammar constructs.
+ Words in all capital letters designate lexical tokens.

When productions or tokens match those in the Cedar policy grammar, use the same names, for example `IDENT` and `Path`.

Grammar constructs use the following symbols:
+ `|` designates alternatives.
+ `[]` designates optional productions.
+ `()` designates grouping.
+ `{}` designates repetition of a form zero or more times.

Tokens are defined using regular expressions:
+ `[]` designates character ranges.
+ `|` designates alternation.
+ `*` , `+` , and `?` designate zero or more, one or more, and zero or one occurrences, respectively.
+ `~` designates complement.
+ `-` designates difference.

The grammar adopts the same string escaping rules as the [Cedar policy grammar](../policies/syntax-grammar.html).

```
Annotation := '@' IDENT '(' STR ')'
Annotations := {Annotations}
Schema    := {Namespace}
Namespace := (Annotations 'namespace' Path '{' {Decl} '}') | Decl
Decl      := Entity | Action | TypeDecl
Entity    := Annotations 'entity' Idents ['in' EntOrTyps] [['='] RecType] ['tags' Type] ';'
Action    := Annotations 'action' Names ['in' RefOrRefs] [AppliesTo]';'
TypeDecl  := Annotations 'type' TYPENAME '=' Type ';'
Type      := Path | SetType | RecType
EntType   := Path
SetType   := 'Set' '<' Type '>'
RecType   := '{' [AttrDecls] '}'
AttrDecls := Annotations Name ['?'] ':' Type [',' | ',' AttrDecls]
AppliesTo := 'appliesTo' '{' AppDecls '}'
AppDecls  := ('principal' | 'resource') ':' EntOrTyps [',' | ',' AppDecls]
           | 'context' ':' RecType [',' | ',' AppDecls]
Path      := IDENT {'::' IDENT}
Ref       := Path '::' STR | Name
RefOrRefs := Ref | '[' [RefOrRefs] ']'
EntTypes  := Path {',' Path}
EntOrTyps := EntType | '[' [EntTypes] ']'
Name      := IDENT | STR
Names     := Name {',' Name}
Idents    := IDENT {',' IDENT}

IDENT     := ['_''a'-'z''A'-'Z']['_''a'-'z''A'-'Z''0'-'9']*
TYPENAME  := IDENT - RESERVED
STR       := Fully-escaped Unicode surrounded by '"'s
PRIMTYPE  := 'Long' | 'String' | 'Bool'
WHITESPC  := Unicode whitespace
COMMENT   := '//' ~NEWLINE* NEWLINE
RESERVED  := 'Bool' | 'Boolean' | 'Entity' | 'Extension' | 'Long' | 'Record' | 'Set' | 'String'
```

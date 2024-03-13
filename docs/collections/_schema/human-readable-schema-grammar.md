---
layout: default
title: Human-readable schema grammar
nav_order: 2
---
<!-- markdownlint-disable-file MD040 -->

# Grammar specification for the human-readable schema format {#schema-grammar}
{: .no_toc }

This topic describes the grammar specification for the human-readable schema format. For a more complete description, see [Schema format](../schema/human-readable-schema-format).

The grammar applies the following the conventions. Capitalized words stand for grammar productions, and lexical tokens are given in all-caps. When productions or tokens match those in the Cedar policy grammar, we use the same names (e.g., `IDENT` and `Path`).

For grammar productions it uses `|` for alternatives, `[]` for optional productions, `()` for grouping, and `{}` for repetition of a form zero or more times.

Tokens are defined using regular expressions, where `[]` stands for character ranges; `|` stands for alternation; `*` , `+` , and `?` stand for zero or more, one or more, and zero or one occurrences, respectively; `~` stands for complement; and `-` stands for difference. The grammar ignores whitespace and comments.

The grammar adopts the same string escaping rules as Cedar policy grammar.

```
Schema    := {Namespace}
Namespace := ('namespace' Path '{' {Decl} '}') | Decl
Decl      := Entity | Action | TypeDecl
Entity    := 'entity' Idents ['in' EntOrTyps] [['='] RecType] ';'
Action    := 'action' Names ['in' RefOrRefs] [AppliesTo]';'
TypeDecl  := 'type' IDENT '=' Type ';'
Type      := Path | SetType | RecType
EntType   := Path
SetType   := 'Set' '<' Type '>'
RecType   := '{' [AttrDecls] '}'
AttrDecls := Name ['?'] ':' Type [',' | ',' AttrDecls]
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
STR       := Fully-escaped Unicode surrounded by '"'s
PRIMTYPE  := 'Long' | 'String' | 'Bool'
WHITESPC  := Unicode whitespace
COMMENT   := '//' ~NEWLINE* NEWLINE
```

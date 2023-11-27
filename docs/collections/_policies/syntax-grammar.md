---
layout: default
title: Policy grammar
nav_order: 6
---
<!-- markdownlint-disable-file MD040 -->

# Grammar specification for Cedar policy syntax {#syntax-grammar}
{: .no_toc }

This topic describes the grammar specification for the Cedar Policy Language. This grammar uses the following symbols:

+ A vertical bar `|` designates alternatives. Only one alternative can be used.
+ Brackets `[ ]` designate an optional element.
+ Parentheses `( )` designate grouping
+ Braces `{ }` designate repetition of an element zero or more times.

Capitalized words represent grammar constructs, and lexical tokens are displayed in all-caps.

Tokens are defined using regular expressions:

+ Brackets `[ ]` represent a range of characters.
+ A vertical bar `|` designates alternatives.
+ An asterisk `*` represents zero or more occurrences of an element.
+ A plus sign `+` represents one or more occurrences of an element.
+ A question mark `?` represents exactly zero or one occurrences of an element.
+ A tilde `~` represents the complement of the following element.
+ A hyphen `-` represents difference.
+ Single quotation marks `' '` surround elements that must be entered literally as shown.

The grammar ignores whitespace and comments.

## `Policy` {#grammar-policy}

A policy consists of optional 'Annotation' entries, an `Effect`, a `Scope` in parentheses `( )`, and an optional set of `Conditions` in braces `{ }`.

A policy must always end with a semicolon `;`.

```
Policy ::= {Annotation} Effect '(' Scope ')' {Conditions} ';'
```

## `Effect` {#grammar-effect}

The `Effect` element of a policy is either the word `permit` or `forbid`.

```
Effect ::= 'permit' | 'forbid'
```

## `Scope` {#grammar-scope}

The `Scope` element of a policy must include a `Principal` entity, an `Action` entity, and a `Resource` entity.

```
Scope ::= Principal ',' Action ',' Resource
```

## `Principal` {#grammar-principal}

The `Principal` element consists of the `principal` keyword. If specified by itself, the policy statement matches *any* principal.

Optionally, the keyword can be followed by either the [`in`](../policies/syntax-operators.html#operator-in) or [`==`](../policies/syntax-operators.html#operator-equality) operator, followed by either an `Entity`, or the `?principal` placeholder when used in a policy template.

```
Principal ::= 'principal' [('in' | '==') (Entity | '?principal')]
```

## `Action` {#grammar-action}

The `Action` element consists of the `action` keyword. If specified by itself, it matches any action. Optionally, it can be followed by either the [`==`](../policies/syntax-operators.html#operator-equality) operator and an action entity, or [`in`](../policies/syntax-operators.html#operator-in) followed by an action entity or a [set](../policies/syntax-datatypes.html#datatype-set) of action entities.

```
Action ::= 'action' [( '==' Entity | 'in' ('[' EntList ']' | Entity) )]
```

## `Resource` {#grammar-resource}

The `Resource` consists of the `resource` keyword. If specified by itself, it matches any resource. Optionally, it can be followed by either the [`in`](../policies/syntax-operators.html#operator-in) or [`==`](../policies/syntax-operators.html#operator-equality) operator, followed by an entity, or the `?resource` placeholder when used in a policy template.

```
Resource ::= 'resource' [('in' | '==') (Entity | '?resource')]
```

## `Condition` {#grammar-condition}

A `Condition` consists of either the `when` or `unless` keyword followed by a Boolean expression surrounded by braces `{ }`. A `when` clause matches the request when the expression evaluates to `true`. An `unless` clause matches the request when the expression \(an [Expr](#grammar-expr) element\) evaluates to `false`.

The parent [Policy](#grammar-policy) element can have zero or more `when` or `unless` clauses.

```
Condition ::= ('when' | 'unless') '{' Expr '}'
```

## `Expr` {#grammar-expr}

```
Expr ::= Or | 'if' Expr 'then' Expr 'else' Expr
```

## `Or` {#grammar-or}

```
Or ::= And {'||' And}
```

For more details, see [`||` \(OR\)](../policies/syntax-operators.html#operator-or).

## `And` {#grammar-and}

```
And ::= Relation {'&&' Relation}
```

For more details, see [`&&` \(AND\)](../policies/syntax-operators.html#operator-and).

## `Relation` {#grammar-relation}

```
Relation ::= Add [RELOP Add] | Add 'has' (IDENT | STR) | Add 'like' PAT | Add 'is' Path ('in' Add)?
```

## `Add` {#grammar-add}

```
Add ::= Mult {('+' | '-') Mult}
```

## `Mult` {#grammar-mult}

```
Mult ::= Unary { '*' Unary}
```

Cedar places a syntactic constraint on the multiplication operation. At most, one of the operands can be something other than an integer literal. For example, `1 * 2 * context.value * 3` is allowed. However, `context.laptopValue * principal.numOfLaptops` isn't allowed.

## `Unary` {#grammar-unary}

```
Unary ::= ['!' | '-']x4 Member
```

## `Member` {#grammar-member}

```
Member ::= Primary {Access}
```

## `Annotation` {#grammar-annotation}

```
Annotation ::= '@'IDENT'('STR')'
```

## `Access` {#grammar-access}

```
Access ::= '.' IDENT ['(' [ExprList] ')'] | '[' STR ']'
```

## `Primary` {#grammar-primary}

```
Primary ::= LITERAL 
           | VAR 
           | Entity 
           | ExtFun '(' [ExprList] ')' 
           | '(' Expr ')' 
           | '[' [ExprList] ']' 
           | '{' [RecInits] '}'
```

## `Path` {#grammar-path}

```
Path ::= IDENT {'::' IDENT}
```

## `Entity` {#grammar-entity}

```
Entity ::= Path '::' STR
```

## `EntList` {#grammar-entlist}

```
EntList ::= Entity {',' Entity}
```

## `ExprList` {#grammar-exprlist}

```
ExprList ::= Expr {',' Expr}
```

## `ExtFun` {#grammar-extfun}

```
ExtFun ::= [Path '::'] IDENT
```

## `RecInits` {#grammar-recinits}

```
RecInits ::= (IDENT | STR) ':' Expr {',' (IDENT | STR) ':' Expr}
```

## `RELOP` {#grammar-relop}

```
RELOP ::= '<' | '<=' | '>=' | '>' | '!=' | '==' | 'in'
```

## `IDENT` {#grammar-ident}

```
IDENT ::= ['_''a'-'z''A'-'Z']['_''a'-'z''A'-'Z''0'-'9']* - RESERVED
```

## `STR` {#grammar-str}

```
STR ::= Fully-escaped Unicode surrounded by '"'s
```

## `PAT` {#grammar-pat}

```
PAT ::= STR with `\*` allowed as an escape
```

## `LITERAL` {#grammar-literal}

```
LITERAL ::= BOOL | INT | STR
```

## `BOOL` {#grammar-bool}

```
BOOL ::= 'true' | 'false'
```

## `INT` {#grammar-int}

```
INT ::= '-'? ['0'-'9']+
```

## `RESERVED` {#grammar-reserved}

```
RESERVED ::= BOOL | 'if' | 'then' | 'else' | 'in' | 'like' | 'has'
```

## `VAR` {#grammar-var}

```
VAR ::= 'principal' | 'action' | 'resource' | 'context'
```

## `WHITESPC` {#grammar-whitespc}

```
WHITESPC ::= Unicode whitespace
```

## `COMMENT` {#grammar-comment}

```
COMMENT ::= '//' ~NEWLINE* NEWLINE
```

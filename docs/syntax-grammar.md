---
layout: default
title: Grammar
parent: Policy syntax
nav_order: 5
---

# Grammar specification for Cedar<a name="syntax-grammar"></a>
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

## `Policy`<a name="grammar-policy"></a>

A policy consists of an `Effect`, a `Scope` in parentheses `( )`, and an optional set of `Conditions` in braces `{ }`.

A policy must always end with a semicolon `;`.

```
Policy := Effect '(' Scope ')' [ {Conditions} ] ';'
```

## `Effect`<a name="grammar-effect"></a>

The `Effect` element of a policy is either the word `permit` or `forbid`.

```
Effect := 'permit' | 'forbid'
```

## Scope<a name="grammar-scope"></a>

The `Scope` element of a policy must include a `Principal` entity, an `Action` entity, and a `Resource` entity.

```
Scope := Principal ',' Action ',' Resource
```

## `Principal`<a name="grammar-principal"></a>

The `Principal` element consists of the `principal` keyword. If specified by itself, the policy statement matches *any* principal.

Optionally, the keyword can be followed by either the [`in`](syntax-operators.md#operator-in) or [`==`](syntax-operators.md#operator-equality) operator, followed by either an `Entity`, or the `?principal` placeholder when used in a policy template.

```
Principal := 'principal' [('in' | '==') (Entity | '?principal')]
```

## `Action`<a name="grammar-action"></a>

The `Action` element consists of the `action` keyword. If specified by itself, it matches any action. Optionally, it can be followed by either the [`in`](syntax-operators.md#operator-in) or [`==`](syntax-operators.md#operator-equality) operator, followed by an action entity or a [set](syntax-datatypes.md#datatype-set) of action entities.

```
Action := 'action' [('in' '[' EntList ']' | '==' Entity)]
```

## `Resource`<a name="grammar-resource"></a>

The `Resource` consists of the `resource` keyword. If specified by itself, it matches any resource. Optionally, it can be followed by either the [`in`](syntax-operators.md#operator-in) or [`==`](syntax-operators.md#operator-equality) operator, followed by an entity, or the `?resource` placeholder when used in a policy template.

```
Resource := 'resource' [('in' | '==') (Entity | '?resource')]
```

## `Condition`<a name="grammar-condition"></a>

A `Condition` consist of either the `when` or `unless` keyword followed by a Boolean expression surrounded by braces `{ }`. A `when` clause matches the request when the expression evaluates to `true`. An `unless` clause matches the request when the expression \(an [Expr](#grammar-expr) element\) evaluates to `false`. 

The parent [Policy](#grammar-policy) element can have zero or more `when` or `unless` clauses.

```
Conditions := ('when' | 'unless') '{' Expr '}'
```

## `Expr`<a name="grammar-expr"></a>

```
Expr := Or | 'if' Expr 'then' Expr 'else' Expr
```

## `Or`<a name="grammar-or"></a>

```
Or := And {'||' And}
```

For more details, see [`||` \(OR\)](syntax-operators.md#operator-or).

## `And`<a name="grammar-and"></a>

```
And := Relation {'&&' Relation}
```

For more details, see [`&&` \(AND\)](syntax-operators.md#operator-and).

## `Relation`<a name="grammar-relation"></a>

```
Relation := Add [RELOP Add] | Add 'has' (IDENT | STR) | Add 'like' PAT
```

## `Add`<a name="grammar-add"></a>

```
Add := Mult {('+' | '-') Mult}
```

## `Mult`<a name="grammar-mult"></a>

```
Mult := Unary { '*' Unary}
```

Cedar places a syntactic constraint on the multiplication operation. At most, one of the operands can be something other than an integer literal. For example, `1 * 2 * context.value * 3` is allowed. However, `context.laptopValue * principal.numOfLaptops` isn't allowed.

## `Unary`<a name="grammar-unary"></a>

```
Unary := ['!' | '-']x4 Member
```

## `Member`<a name="grammar-member"></a>

```
Member := Primary {Access}
```

## `Access`<a name="grammar-access"></a>

```
Access := '.' IDENT ['(' [ExprList] ')'] | '[' STR ']'
```

## `Primary`<a name="grammar-primary"></a>

```
Primary := LITERAL 
           | VAR 
           | Entity 
           | ExtFun '(' [ExprList] ')' 
           | '(' Expr ')' 
           | '[' [ExprList] ']' 
           | '{' [RecInits] '}'
```

## `Path`<a name="grammar-path"></a>

```
Path := IDENT {'::' IDENT}
```

## `Entity`<a name="grammar-entity"></a>

```
Entity := Path '::' STR
```

## `EntList`<a name="grammar-entlist"></a>

```
EntList := Entity {',' Entity}
```

## `ExprList`<a name="grammar-exprlist"></a>

```
ExprList := Expr {',' Expr}
```

## `ExtFun`<a name="grammar-extfun"></a>

```
ExtFun := [Path '::'] IDENT
```

## `RecInits`<a name="grammar-recinits"></a>

```
RecInits := (IDENT | STR) ':' Expr {',' (IDENT | STR) ':' Expr}
```

## `RELOP`<a name="grammar-relop"></a>

```
RELOP := '<' | '<=' | '>=' | '>' | '!=' | '==' | 'in'
```

## `IDENT`<a name="grammar-ident"></a>

```
IDENT := ['_''a'-'z''A'-'Z']['_''a'-'z''A'-'Z''0'-'9']* - RESERVED
```

## `STR`<a name="grammar-str"></a>

```
STR := Fully-escaped Unicode surrounded by '"'s
```

## `PAT`<a name="grammar-pat"></a>

```
PAT := STR with `\*` allowed as an escape
```

## `LITERAL`<a name="grammar-literal"></a>

```
LITERAL := BOOL | INT | STR
```

## `BOOL`<a name="grammar-bool"></a>

```
BOOL := 'true' | 'false'
```

## `INT`<a name="grammar-int"></a>

```
INT := '-'? ['0'-'9']+
```

## `RESERVED`<a name="grammar-reserved"></a>

```
RESERVED := BOOL | 'if' | 'then' | 'else' | 'in' | 'like' | 'has'
```

## `VAR`<a name="grammar-var"></a>

```
VAR := 'principal' | 'action' | 'resource' | 'context'
```

## `WHITESPC`<a name="grammar-whitespc"></a>

```
WHITESPC := Unicode whitespace
```

## `COMMENT`<a name="grammar-comment"></a>

```
COMMENT := '//' ~NEWLINE* NEWLINE
```
---
layout: default
title: Schema grammar
parent: Schema format
nav_order: 1
---

# Grammar specification for Cedar schema<a name="schema-grammar"></a>
{: .no_toc }



This topic describes the grammar specification for the Cedar schema. For a more complete description, see [Schema format](schema.md).

This grammar uses the following symbols:

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

## `Schema`<a name="grammar-schema"></a>

A schema consists of a [`NameSpace`](#grammar-schema-NameSpace) JSON object that contains a list of [`EntityTypes`](#grammar-schema-EntityTypes), and a list of [`Actions`](#grammar-schema-Actions).

```
Schema ::= '{' NameSpace ':' '{' EntityTypes ',' Actions [(',' commonTypes )] '}' '}'
```

## `NameSpace`<a name="grammar-schema-NameSpace"></a>

The `NameSpace` element is a string made up of a sequence of one or more substrings separated by double colons (`::`). This namespace serves as a qualifier, or disambiguator, for entity types that might be defined in multiple namespaces. The type reference must include the namespace so that Cedar uses the correct entity type. For more information see [`namespace`](schema.md#schema-namepace).

```
NameSpace ::= STR ('::' STR)*
```

## `EntityTypes`<a name="grammar-schema-EntityTypes"></a>

The `EntityTypes` element is identified by the keyword `entityTypes` followed by a comma-separated list of one or more Entity types supported by your application. For more information see [`entityTypes`](schema.md#schema-entityTypes).

```
EntityTypes ::= 'entityTypes: {' EntityType ( ',' EntityType )* '}'

```

## `EntityType`<a name="grammar-schema-EntityType"></a>

An `EntityType` element describes one entity type supported by your application. It begins with a name string for the entity type that, when qualified by its parent [namespace](#grammar-schema-NameSpace), uniquely identifies this entity type. This element contains a `memberOfTypes` element that is an array list of any parent entity types that entities of this type can be a member or child of in a hierarchy. It also contains a `shape` element that describes how entities of this type are constructed.

```
EntityType ::= IDENT ':' '{' 'memberOfTypes' ':' '[' (EntityType ( ',' EntityType )*)? '],' 'shape': TypeJson '}'
```


## `Actions`<a name="grammar-schema-Actions"></a>

The `Actions` element is a list of the individual actions supported by your application.
```
Actions ::= '"actions"' ':' Action*

```

## `Action`<a name="grammar-schema-Action"></a>

The `Action` element describes one action supported by your application. An action begins with a name string, and includes an `appliesTo` element. The `appliesTo` element defines the principal types, resource types, and other context information that can be specified in a request for the action.
 
```
Action ::= STR ':' '{' '"appliesTo": {' PrincipalTypes? ResourceTypes? Context? '}'
```

## `PrincipalTypes`<a name="grammar-schema-PrincipalTypes"></a>

The `PrincipalTypes` element is identified by the keyword `principalType` followed by a comma-separated listis an array list of the principal types supported by your application. 
 
```
PrincipalTypes ::= '"principalTypes"': '[' IDENT* ']'

```


## `ResourceTypes`<a name="grammar-schema-ResourceTypes"></a>

The `ResourceTypes` element describes
 
```
ResourceTypes ::= '"resourceTypes"': '[' IDENT* ']'
```

## `TypeJson`<a name="grammar-schema-TypeJson"></a>

The `TypeJson` element describes
 
```
TypeJson ::= '{' Type '}'
```


## `Type`<a name="grammar-schema-Type"></a>

The `Type` element describes 
 
```
Type ::= Primitive | Set | EntityRef | Record | Extension
```


## `Primitive`<a name="grammar-schema-Primitive"></a>

The `Primitive` element describes 
 
```
Primitive ::= '"type":' ('"long"' | '"string"' | '"boolean"')
```


## `Set`<a name="grammar-schema-Set"></a>

The `Set` element describes
 
```
Set ::= '"type": "Set", "element": ' TypeJson
```

## `EntityRef`<a name="grammar-schema-EntityRef"></a>

The `EntityRef` element describes
 
```
EntityRef ::= '"type": "Entity", "name": "' Name '"'
```

## `Record`<a name="grammar-schema-Record"></a>

The `Record` element describes
 
```
Record ::= '"type": "Record", "attributes": {' ( RecordAttr (',' RecordAttr )* )? '}'
```

## `RecordAttr`<a name="grammar-schema-RecordAttr"></a>

The `RecordAttr` element describes 
 
```
RecordAttr ::= STR ': {' Type (', "required": ' ( true | false ))? '}'
```

## `STR`<a name="grammar-schema-STR"></a>

The `STR` element describes
 
```
STR := Fully-escaped Unicode surrounded by '"'s
```


## `IDENT`<a name="grammar-IDENT"></a>

The `IDENT` element describes 
```
IDENT := ['_''a'-'z''A'-'Z']['_''a'-'z''A'-'Z''0'-'9']* - RESERVED
```

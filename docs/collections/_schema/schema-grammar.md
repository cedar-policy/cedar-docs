---
layout: default
title: Schema grammar
nav_order: 2
---
<!-- markdownlint-disable-file MD040 -->

# Grammar specification for Cedar schema {#schema-grammar}
{: .no_toc }

This topic describes the grammar specification for the Cedar schema. For a more complete description, see [Schema format](../schema/schema.html).

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

## `Schema` {#grammar-schema}

A schema consists of a [`NameSpace`](#grammar-schema-NameSpace) JSON object that contains a list of [`EntityTypes`](#grammar-schema-EntityTypes), and a list of [`Actions`](#grammar-schema-Actions).
The grammar assumes a particular order of keys in JSON objects to simplify the presentation, but this order is not technically required.
For example, the grammar as written requires that entity type declarations appear before actions, but actions may nonetheless be declared before entity types.

```
Schema ::= '{' NameSpace ':' '{' EntityTypes ',' Actions [',' CommonTypes] '}' '}'
```

## `NameSpace` {#grammar-schema-NameSpace}

The `NameSpace` element is a string made up of a sequence of one or more substrings separated by double colons (`::`). This namespace serves as a qualifier, or disambiguator, for entity types that might be defined in multiple namespaces. The type reference must include the namespace so that Cedar uses the correct entity type. For more information see [`namespace`](../schema/schema.html#schema-namepace).

```
NameSpace ::= '"' STR { '::' STR } '"'
```

## `EntityTypes` {#grammar-schema-EntityTypes}

The `EntityTypes` element is identified by the keyword `entityTypes` followed by a comma-separated list of Entity types supported by your application. For more information see [`entityTypes`](../schema/schema.html#schema-entityTypes).

```
EntityTypes ::= 'entityTypes' ':' '[' [ EntityType { ',' EntityType } ] ']'
```

## `EntityType` {#grammar-schema-EntityType}

An `EntityType` element describes one entity type supported by your application. It begins with a name string for the entity type that, when qualified by its parent [namespace](#grammar-schema-NameSpace), uniquely identifies this entity type. This element contains a `memberOfTypes` element that is an array list of any parent entity types that entities of this type can be a member or child of in a hierarchy. It also contains a `shape` element that describes how entities of this type are constructed.

```
EntityType ::= IDENT ':' '{' [ 'memberOfTypes' ':' '[' [ IDENT { ',' IDENT } ] ']' ] ',' [ 'shape': TypeJson ] '}'
```

## `Actions` {#grammar-schema-Actions}

The `Actions` element is a list of the individual actions supported by your application.

```
Actions ::= '"actions"' ':' '[' [ Action { ',' Action } ] ']'
```

## `Action` {#grammar-schema-Action}

The `Action` element describes one action supported by your application. An action begins with a name string, and may include a `memberOf` and `appliesTo` element.
The `memberOf` element specifies what action groups the declared action is a member of in the action hierarchy.
The `appliesTo` element defines the principal types, resource types, and other context information that can be specified in a request for the action.

```
Action ::= STR ':' '{' [ '"memberOf"' ':' '[' [ STR { ',' STR } ] ']' ] ',' [ '"appliesTo"' ':' '{' [PrincipalTypes] ',' [ResourceTypes] ',' [Context] '}' ] '}'
```

## `PrincipalTypes` {#grammar-schema-PrincipalTypes}

The `PrincipalTypes` element is identified by the keyword `principalType` followed by a comma-separated array list of the principal types supported by your application for the containing action.

```
PrincipalTypes ::= '"principalTypes"': '[' [ IDENT { ',' IDENT } ] ']'
```

## `ResourceTypes` {#grammar-schema-ResourceTypes}

The `ResourceTypes` element follows the same format and serves the same purpose as as the `PrincipalTypes`, but instead lists the resource types supported for the containing action.

```
ResourceTypes ::= '"resourceTypes"': '[' [ IDENT { ',' IDENT } ] ']'
```

## `Context` {#grammar-schema-Context}

The `Context` element describes the type of the context record for an action using the same `TypeJson` format used for the shape of an entity type.

```
Context ::= '"context"' ':' TypeJson
```

## `TypeJson` {#grammar-schema-TypeJson}

The `TypeJson` element describes

```
TypeJson ::= '{' Type '}'
```

## `Type` {#grammar-schema-Type}

The `Type` element describes

```
Type ::= Primitive | Set | EntityRef | Record | Extension
```

## `Primitive` {#grammar-schema-Primitive}

The `Primitive` element describes

```
Primitive ::= '"type":' ('"Long"' | '"String"' | '"Boolean"')
```

## `Set` {#grammar-schema-Set}

The `Set` element describes

```
Set ::= '"type": "Set", "element": ' TypeJson
```

## `EntityRef` {#grammar-schema-EntityRef}

The `EntityRef` element describes

```
EntityRef ::= '"type": "Entity", "name": "' Name '"'
```

## `Record` {#grammar-schema-Record}

The `Record` element describes

```
Record ::= '"type": "Record", "attributes": {' [ RecordAttr { ',' RecordAttr } ] '}'
```

## `RecordAttr` {#grammar-schema-RecordAttr}

The `RecordAttr` element describes

```
RecordAttr ::= STR ': {' Type [',' '"required"' ':' ( true | false )] '}'
```

## `STR` {#grammar-schema-STR}

```
STR ::= Fully-escaped Unicode surrounded by '"'s
```

## `IDENT` {#grammar-IDENT}

```
IDENT ::= ['_''a'-'z''A'-'Z']['_''a'-'z''A'-'Z''0'-'9']* - RESERVED
```

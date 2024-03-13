---
layout: default
title: Human-Readable schema format
nav_order: 2
---

# Human-readable schema format {#schema}
{: .no_toc }

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

This topic describes Cedar's human-readable schema format.

## Schema format {#schema-format}

A schema consists of zero or more namespaces, each of which contains declarations of three types --- *Entity Type Declaration*, *Action Declaration*, and *Common Type Declaration*. These declarations define entity types and actions, and common types that define types that can be referenced by the Entity Type and Action Declarations. Declarations are delimited by `;` characters. Note that in the human-readable schema format, unlike in the JSON schema format, you can write Cedar-style comments.

## NameSpace {#schema-namespace}

You can create a namespace that you want to associate with your declarations. Add the namespace key word, for example `namespace Foo { entity Bar; }`. The name of a namespace must be an identifier as specified in Cedar syntax. Anything declared in this namespace must be referred to in its fully-qualified form when referenced outside of the namespace, so the declared entity type would be `Foo::Bar`.

Alternatively, you can create a declaration without a namespace, for example `entity Bar;`. The names of declarations that lack a namespace are always referred to without qualification, for example `Bar`.

Multiple `namespace` declarations with the same names are disallowed. This rule also applies to the inner declarations like entity type declarations.

## Entity type {#schema-entityTypes}

The following entity type declaration specifies an entity type `User` , whose parent entity type is `Group`. Entities of type `User` have three attributes: 
+ `personalGroup` of type `Group`
+ `delegate` of type `User`
+ `blocked` of type `Set<User>`

The attribute `delegate` is optional, as indicated by the `?` after the attribute name.

```cedar
entity User in [Group] {
    personalGroup: Group,
    delegate?: User,
    blocked: Set<User>,
};
```

Note that in the human-readable schema format, unlike in the JSON schema format, you can declare multiple entity types that share the same definition using a single declaration. For example, `entity UserA, UserB, UserC` declares entity types `UserA`, `UserB`, and `UserC` that all have the same membership relations and shapes.

### Membership relations {#schema-entitytypes-memberOf}

Set an entity to be a member of another with `in <EntityTypes>` after `entity <EntityName>`. The `EntityTypes` declaration can be a list of entity type names surrounded by brackets (`[]`) and delimited by commas `,`, for example `entity User in [UserGroup1, UserGroup2]`. Entities with one parent type don't require brackets, for example `entity User in UserGroup`. 

The membership relation declaration is optional. If you don't create this declaration, the declared entity type doesn't have any parent entity types. 

### Shape {#schema-entitytypes-shape}

Specify the shape of an entity type using the [record syntax](../policies/syntax-datatypes.html#datatype-record) of Cedar policies. Enclose attribute declarations in brackets, each of which is a `<Name>:<Type>` key-value pair. Attribute names are either identifiers or strings. Such a declaration also defines a [record schema type](#schema-entitytypes-shape-record). To make entity type declarations consistent with [common type declarations](#schema-commonTypes), you can prefix a `=` to attribute declarations, for example `entity User = {...};`.

Note that if you omit attribute declarations, then entities of this type don't have any attributes. This is equivalent to specifying an empty record (i.e., `{}`).


### Schema types {#schema-types}

Schema types can be used as RHS of an attribute or common type declaration. 

Cedar data types have corresponding schema types. The corresponding type names of Cedar primitive data types [Boolean](../policies/syntax-datatypes.html#datatype-boolean), [String](../policies/syntax-datatypes.html#datatype-string), [Long](../policies/syntax-datatypes.html#datatype-string) are `Bool`, `String`, `Long`, respectively. 

An entity type or an extension type is specified by its name. The entity type name is an identifier or identifiers separated by `::`. For example, both `User` and `ExampleCo::User` are valid entity type names. 

An extension type name is an identifier. Currently, `ipaddr` and `decimal` are the only available extension type names. Since the release of version 3.1 of the Cedar language, the namespace `__cedar` is a reserved namespace. You can specify fully-qualified type names for primitive and extension types under the `__cedar` namespace. For example, `__cedar::ipaddr` uniquely identifies the `ipaddr` extension type.

Format composite data type declarations as follows.

#### Record {#schema-entitytypes-shape-record}
{: .no_toc }

The specification of a record type is similar to that of a Cedar record, except that values of a record in the human-readable schema are types. For example, you can declare a record type as follows.

```cedar
{
  name: String,
  features: {
    age: Long,
    height: Long,
    eyecolor: String
  }
}
```

#### Set {#schema-entitytypes-shape-set}
{: .no_toc }

A set type declaration consists of keyword `Set` and an element type surrounded by angle brackets (`<>`). For example, `Set<Long>` is a set type made up of values of type `Long`.


## Actions {#schema-actions}

The following action declaration defines the action `ViewDocument`. It has the following characteristics:
+ It's a member of action group `ReadActions`
+ It applies to principals of entity type `User` and `Public`
+ It applies to resources of entity type `Document`
+ It applies to context of record types `network: ipaddr` and `browser: String`.

```cedar
action ViewDocument in [ReadActions, ExampleNS::Action::"Write"] appliesTo {
    principal: [User,Public],
    resource: Document,
    context: {
        network: ipaddr,
        browser: String
    }
};
```

An action name is either an identifier or a string. The membership relation syntax of action declarations is like that of entity declarations, but parent action names can be strings, and entity type names must be identifiers. If a parent action is declared in another namespace, its name must be a *fully-qualified action entity name*. This is illustrated by the action `Write` in the example action declaration. It's declared in the namespace `ExampleNS` with the fully-qualified name  `ExampleNS::Action::"Write"`.

The `appliesTo` construct specifies an action's applicability. It is a record of three optional keys: `principal`, `resource`, and `context` that the action applies to. Without the `appliesTo` construct in your schema, the actions do not apply to any principals, resources, or contexts. The `principal` and `resource` keys, if given, must an entity type or a non-empty list of entity types. Without `principal` or `resource` keys in your schema, the action applies to *unspecified* principals or resources, respectively.
The `context` value must be a record and its absence defaults to an empty record.

## Common types {#schema-commonTypes}

Like in the JSON schema format, human-readable schema syntax allows for declarations of common types so that entity type declarations can use them to avoid error-prone duplication. The syntax of common type declarations is similar to defining type aliases in most programming languages: `type <Id> = <Type>` . The `Type` value is a schema type name, excluding common types to avoid definitional circularity.

## Type name disambiguation

Type names in the human-readable schema format can conflict with each other. For example, `ipaddr` is a valid unqualified common type name as well as an extension type name. `Foo::Bar` is a valid qualified common type name and an entity type name. Cedar uses the following rules to disambiguate type names.

1. Primitive and extension type names cannot alias by design.
2. Type references are resolved in a priority order.
3. To disambiguate extension and primitive types from others, the namespace `__cedar` is reserved. For example, `__cedar::Long` uniquely refers to Cedar primitive type `Long`.

The priority order is 
```
common type > entity type > primitive/extension type
```
A type name is resolved by checking if it is declared as a common type, then entity type, and finally a primitive or extension type. The following example demonstrates this rule.

```cedar
namespace Demo {
  entity Host {
    // the type of attribute `ip` is common type `ipaddr`
    // instead of extension type `__cedar::ipaddr`
    // because the former has a higher priority
    ip: ipaddr,
    // the type of attribute `bandwidth` is extension type `decimal`
    // because there is not any common type or entity type
    // that shares the same name
    bandwidth: decimal,
  };
  // An artificial entity type name that conflicts with
  // primitive type `String`
  entity String {
    groups: Set<__cedar::String>,
  };
  // A common type name that conflicts with extension
  // type `ipaddr`
  type ipaddr = {
    // The type of attribute `repr` is the entity type
    // `String` declared above instead of primitive type
    // `__cedar::String` because the former has a higher
    // priority
    repr: String,
    // The type of attribute `isV4` is the primitive type
    // `Bool` because there is not any common type or
    // entity type that shares the same name
    isV4: Bool,
  };
}
```

 Common types and entity types can both be qualified with namespaces. 
 The human-readable format allows *inline* declarations. Because of this, there may be conflicts between type names declared within a namespace and those declared using inline declarations. The resolution rule for this scenario is like *static scoping*: type names within the same namespace have higher priority. The following example demonstrates this rule.

 ```
type id = {
  group: String,
  name: String,
};

type email_address = {
  id: String,
  domain: String,
};

namespace Demo {
  entity User {
    // The type of attribute `name` is the primitive type `String`
    // because there is a common type declaration below.
    name: id,
    // The type of attribute `email` is the common type `email_address`
    // declared above.
    email: email_address;
  };
  type id = String;
}
```

## Example schema {#schema-examples}

The following schema is for the hypothetical application PhotoFlash.

```
namespace PhotoFlash {
  entity User in UserGroup = {
    "department": String,
    "jobLevel": Long,
  };
  entity UserGroup;
  entity Album in Album = {
    "account": Account,
    "private": Bool,
  };
  entity Account = {
    "admins"?: Set<User>,
    "owner": User,
  };
  entity Photo in Album = {
    "account": Account,
    "private": Bool,
  };
  action "uploadPhoto" appliesTo {
    principal: User, 
    resource: Album, 
    context: {
      "authenticated": Bool,
      "photo": {
        "file_size": Long,
        "file_type": String,
      },
    }
  };
  action "viewPhoto" appliesTo {
    principal: User, 
    resource: Photo, 
    context: {
      "authenticated": Bool,
    }
  };
  action "listAlbums" appliesTo {
    principal: User, 
    resource: Account, 
    context: {
      "authenticated": Bool,
    }
  };
}
```
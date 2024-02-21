---
layout: default
title: Human-Readable schema format
nav_order: 2
---

# Human-Readable schema format {#schema}
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

A schema consists of zero or more namespaces, each of which contains declarations of three types --- *Entity Declaration*, *Action Declaration*, and *Common Type Declaration*. These declarations define entity types, actions, and common types used to define the former two, respectively. Declarations are delimited by `;`s. Note that unlike the JSON schema format, the human-readable schema format allows you to write Cedar-style comments.

## NameSpace {#schema-namespace}

You can group the declarations of a namespace by wrapping them with curly braces like `namespace Foo {...}`. A name must be given for a namespace specified by such syntax. An alternative way to declare a namespace is to “inline” declarations like `entity Bar; namespace Foo {...}`, where the entity declaration of `Bar` is under the same scope of namespace `Foo`. Names of these declarations are always referred as they are whereas declaration names of a `namespace` construct must be referred as their fully-qualified forms in other namespaces.

Multiple `namespace` declarations with the same names are disallowed. This rule also applies to the inner declarations like entity type declarations.

## Entity type {#schema-entityTypes}

The following entity type declaration specifies an entity type `User` , whose parent entity type is `Group`. Entities of type `User` have three attributes, `personalGroup` of type `Group`, `delegate` of type `User`, and `blocked` of type `Set<User>`, respectively. The attribute `delegate` is optional, which is specified by the `?` after the attribute name.

```
entity User in [Group] {
    personalGroup: Group,
    delegate?: User,
    blocked: Set<User>,
};
```

Note that, unlike the JSON schema format, human-readable schema syntax allows you to declare multiple entity types that share the same definition using a single declaration. For example, `entity UserA, UserB, UserC ...` declares entity types `UserA`, `UserB`, and `UserC` that all have the same membership relations and shapes.

### Membership relations {#schema-entitytypes-memberOf}

The parent types are specified by `in <EntityTypes>` after `entity <EntityName>`, where `EntityTypes` can be a list of entity type names surrounded by brackets and delimited by `,`, or an entity type name if there is only one parent type. For example, you can also declare entity type `User` like `entity User in Group ...`. The membership relation declaration is optional, whose absence means that the declared entity type does not have any parent entity types. 

### Shape {#schema-entitytypes-shape}

You specify the shape of an entity type using the [record syntax](../policies/syntax-datatypes.html#datatype-record) of Cedar policies. That is, attribute declarations are enclosed by brackets, each of which is a `<Name>:<Type>` pair. Attribute names are either identifiers or strings. Such a declaration also defines a record type. We will visit schema type syntax later in the document. To make entity type declarations consistent with common type declarations, users can write a `=` before attribute declarations like `entity User = {...};`.

Note that if you omit attribute declarations, then entities of this type do not have any attributes. This is equivalent to specifying an empty record (i.e., `{}`).


### Schema types {#schema-types}

The corresponding type names of Cedar data types [Boolean](../policies/syntax-datatypes.html#datatype-boolean), [String](../policies/syntax-datatypes.html#datatype-string), [Long](../policies/syntax-datatypes.html#datatype-string) are `Bool`, `String`, `Long`, respectively. An entity type or an extension type is specified by its name. The entity type name is either an identifier or identifiers separated by `::`. For example, both `User` and `ExampleCo::User` are both valid entity type names. An extension type name is just an identifier, specifically, `ipaddr` or `decimal` as of now.

We detail the declarations of composite data types as follows.

#### Record {#schema-entitytypes-shape-record}
{: .no_toc }

The specification of a record type is similar to that of a Cedar record, except that "values" of the former are types. For example, you can declare a record type as follows.

```
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

A set type declaration consists of keyword `Set` and an element type surrounded by brackets (`<>`). For example, `Set<Long>` represents a set of `Long`s.


## Actions {#schema-actions}

The following action declaration specifies an action `ViewDocument`. It is a child action of action group `ReadActions` and applies to principals of entity type `User` and `Public`, resources of entity type `Document` and contexts of record type `{ network: ipaddr, browser: String}`.

```
action ViewDocument in [ReadActions] appliesTo {
    principal: [User,Public],
    resource: Document,
    context: {
        network: ipaddr,
        browser: String
    }
};
```

An action name is either an identifier or a string. The membership relation syntax of action declarations is akin to that of entity declarations. The difference is that action names could be strings but entity type names must be identifiers.

The `appliesTo` construct specifies an action's applicability. It is a record of three optional keys: `principal`, `resource`, and `context` that specifies principals, resources, and contexts to which the action apply. Absence of the `appliesTo` construct means that the actions do not apply to any principals/resources/contexts. `principal` or `resource` keys, if given, must an entity type or a non-empty list of entity types. Absence of `principal` or `resource` keys means that the action applies to *unspecified* principals or resources, respectively.
The `context` value must be a record and its absence defaults to an empty record.

## Common types {#schema-commonTypes}

Like the JSON schema format, human-readable schema syntax allows for declarations of common types so that entity type declarations can use them to avoid error-prone duplication. The syntax of common type declarations is similar to defining type aliases in most programming languages: `type <Id> = <Type>` . The right hand side of `=` is a schema type name except for common types to avoid definitional circularity.

## Type name disambiguation

Type names in the human-readable schema format can conflict with each other. For example, `ipaddr` is a valid unqualified common type name as well as an extension type name. `Foo::Bar` is a valid qualified common type name and an entity type name. We use the following rules to disambiguate type names.

1. Primitive and extension type names cannot alias by design.
2. Type references are resolved in a priority order.
3. Reserve `__cedar` as a namespace to disambiguate extension/primitive types from others. For example, `__cedar::Long` uniquely refers to Cedar primitive type `Long`.

We elaborate the second rule as the others are obvious. The priority order is common type > entity type > primitive/extension type. In other words, a type name is resolved by checking if it is declared as a common type, then entity type, and finally a primitive or extension type. The following example demonstrate this rule.

```
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

 Note that both common types and entity types can be qualified with namespaces. And the human-readable format allows "inline" declarations. So, there may be conflicts between type names declared within a namespace and those declared using "inline" declarations. The resolution rule for this scenario is akin to static scoping. That is, type names within the same namespace have higher priority. The following example demonstrates this rule.

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
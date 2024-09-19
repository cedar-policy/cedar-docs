---
layout: default
title: Schema formats
nav_order: 1
---

# Cedar schema {#schema}
{: .no_toc }

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

This topic describes the structure of a Cedar schema. Cedar has two schema formats: a human-readable format (which we call the Cedar format) and JSON. The syntax of the Cedar schema format is similar to that of Cedar policies. The JSON schema format is based on [JSON Schema](https://json-schema.org/), with some adaptations for unique aspects of Cedar, like the use of entity types. The two schema formats are interchangeable and the Cedar CLI can translate schemas in one format to the other. We encourage you to use the Cedar schema format for its simplicity and conciseness. For details, see [Cedar schema format](../schema/human-readable-schema.html) and [JSON schema format](../schema/json-schema.html).

## Overview {#schema-overview}
A schema is a declaration of the structure of the entity types that you want to support in your application and for which you want Cedar to provide authorization services.
After you define a schema, you can ask Cedar to [validate your policies](../policies/validation.html) against it to ensure that your policies do not contain type errors, such as referencing the entities and their attributes incorrectly.

{: .warning }
>If you change your schema, any policies that you validated before the change might no longer be valid. Those policies can then generate errors during authorization queries if you include entities that match the updated schema in your request. 
> Policies that result in errors aren't included in the authorization decision, possibly leading to unexpected results. Therefore, we strongly recommend that you review your policies to see which might be affected by the schema change, and edit those policies so that they accurately reflect the entities that you now include in your evaluation requests.

You can use a schema to define each of the following entities used by your application:

+ **Principals** – The entities that represent the users of your application. In the schema for the example [PhotoFlash](../schema/human-readable-schema.html#schema-examples) application, the principals consist of the `User` and `UserGroup` entity types. You can define the properties of each principal, such as a name, age, address, or any other characteristic that is important to your application.
+ **Resources** – The entities that your principals can interact with. In the [PhotoFlash](../schema/human-readable-schema.html#schema-examples) application, resource entities could include the `Photo` and the `Album` resource types. These resource entities can also include the properties of each resource, such as a photo's name, location where taken, resolution, codec type, and so on.
+ **Actions** – The operations that principals can perform on your resources. These operations include specifying which resource types each action can apply to and which principal types can perform each action. In the [PhotoFlash](../schema/human-readable-schema.html#schema-examples) application, actions include viewing photos, uploading photos, and listing albums.

Services that use Cedar can use the information provided in the schema to validate the policies you submit to the policy store. This helps prevent your policies from returning incorrect authorization decisions because of errors in policies like incorrectly typed attribute names. For more information about validating your policies, see [Cedar policy validation against schema](../policies/validation.html).

Both schema formats implement the same ideas, which we detail as follows. We then present their Cedar and JSON realizations.

## Schema {#schema-format}

A schema contains a declaration of one or more namespaces, each of which contains declarations of entity types, actions, and common types. A namespace has an optional name.

**Schema topics**
* [Cedar schema format](../schema/human-readable-schema.html#schema-format)
* [JSON schema format](../schema/json-schema.html#schema-format)

## Namespace {#schema-namespace}

A [namespace](../overview/terminology.html#term-namespaces) declaration identifies and defines a scope for all entity types, actions, and common types declared within it. The name of a namespace consists of identifiers separated by double colons (`::`).

{: .important }
>The namespace name must be normalized and cannot include any embedded whitespace, such as spaces, newlines, control characters, or comments.  

A namespace declaration contains three types of declarations, appearing in any order:

+ [entity types](#schema-entityTypes)
+ [actions](#schema-actions)
+ [common types](#schema-commonTypes) (optional)

You define the types of your application's principal and resource entities via entity type declarations, and its actions via action declarations. Optionally, you can define type names in common type declarations and reference those names as types in other places in the schema. For example, a common practice is to name a shared record type in this way and refer it, e.g., in entity attribute declarations.

Declarations (e.g, entity types) of a namespace must be qualified with its name to be referred in other namespaces. They can be referred in qualified or unqualified forms within the same namespace. For example, you can only refer the entity type `Table` declared in the namespace `ExampleCo::Database1` as `ExampleCo::Database1::Table` in the namespace `ExampleCo::Database2`.

If you change a declared namespace in your schema you will need to change the entity types appearing in your policies and/or in other namespaces declared in your schema to instead reference the changed namespace.

**Namespace topics**
* [Cedar schema format](../schema/human-readable-schema.html#schema-namespace)
* [JSON schema format](../schema/json-schema.html#schema-namespace)

## Entity types {#schema-entityTypes}

A collection of the `principal` and `resource` entity types supported by your application. An entity type name is a Cedar identifier. An entity type declaration specifies its membership relations with other entity types and its shape/attributes.

{: .important }
>The entity type name must be normalized and cannot include any embedded whitespace, such as spaces, newlines, control characters, or comments.

**Entity type topics**
* [Cedar schema format](../schema/human-readable-schema.html#schema-entityTypes)
* [JSON schema format](../schema/json-schema.html#schema-entityTypes)

### Membership relation

Specifies a list of entity types that can be *direct* parents of entities of this type.

**Membership topics**
* [Cedar schema format](../schema/human-readable-schema.html#schema-entitytypes-memberOf)
* [JSON schema format](../schema/json-schema.html#schema-entitytypes-memberOf)

### Shape/Attributes

Specifies the shape of the data stored in entities of this type. More precisely, it defines the attributes of an entity type --- their names, types, and optionality.
An attribute type is one of the [Cedar supported data types](../policies/syntax-datatypes.html) or a common type, which have different representations in the Cedar format and the JSON format.
You can choose to specify whether an attribute is required or optional. By default, attributes that you define are required. This means that policies that reference this type can assume that the attribute is always present.

A policy should check for an optional attribute's presence by using the [`has`](../policies/syntax-operators.html#operator-has) operator before trying to access the attribute's value. If evaluation of a policy results in an attempt to access a non-existent attribute, evaluation fails with an error (which causes the policy to be ignored during authorization, and for a diagnostic to be generated). The validator will flag the potential for such errors to occur.

**Shape topics**
* [Cedar schema format](../schema/human-readable-schema.html#schema-entitytypes-shape)
* [JSON schema format](../schema/json-schema.html#schema-entitytypes-shape)

## Actions {#schema-actions}

A collection of the `Action` entities usable as actions in authorization requests submitted by your application. The action name is an [entity identifier (EID)](../policies/syntax-entity.html#entity-overview) (rather than an entity type, as in the entity type section). For example, the action entity name of action declaration `viewPhoto` of the PhotoFlash application is `PhotoFlash::Action::"viewPhoto"` because `PhotoFlash::Action` is the fully-qualified action entity type.

An action declaration specifies an action's membership relations with action groups, its applicability (with respect to principal and resource entity types, and the context shape).

**Actions topics**
* [Cedar schema format](../schema/human-readable-schema.html#schema-actions)
* [JSON schema format](../schema/json-schema.html#schema-actions)

## Common type {#schema-commonTypes}

Your schema might define several entity types that share a lot of elements in common. Instead of redundantly entering those elements separately for each entity that needs them, you can define those elements once using a common type construct with a name, and then reference that construct's name in each entity that requires them. You can use this anywhere you can define a Cedar type that includes a data type specification and a set of attributes.

### Motivating example

Suppose your schema defines several entity types or action entities that share a lot of elements in common. For example, consider the following actions in the Cedar schema format: both `view` and `upload` have identical `context` components.

```cedar
action view appliesTo {
    principal: User,
    resource: File,
    context: {
        ip: ipaddr,
        is_authenticated: Bool,
        timestamp: Long
    }
};
action upload appliesTo {
    principal: User,
    resource: Server,
    context: {
        ip: ipaddr,
        is_authenticated: Bool,
        timestamp: Long
    }
};
```

Instead of redundantly entering common type elements separately for each action / entity type that needs them, you can define them once using a common type declaration, and then refer to the definition in multiple places, like so:

```cedar
type commonContext = {
    ip: ipaddr,
    is_authenticated: Bool,
    timestamp: Long
};
action view appliesTo {
    context: commonContext
};
action upload appliesTo {
    context: commonContext
};
```

**Common types topics**
* [Cedar schema format](../schema/human-readable-schema.html#schema-commonTypes)
* [JSON schema format](../schema/json-schema.html#schema-commonTypes)

---
layout: default
title: Entities
nav_order: 2
---

# Entities in Cedar {#syntax-entity}
{: .no_toc }

An entity in Cedar is a stored object that serves as the representation for [principals](../policies/syntax-policy.html#term-parc-principal), [actions](../policies/syntax-policy.html#term-parc-action), and [resources](../policies/syntax-policy.html#term-parc-resource) that are part of your application.
<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Overview of entities {#entity-overview}

An entity in Cedar has the following components.

+ **An entity type** &ndash; The type determines which attributes are required or supported for entities of that type. Examples include things like `User`, `Photo`, `Album`, `Group`, or `Account`. Define entity types as part of your application's [schema](../overview/terminology.html#term-schema). The schema assigns special meaning to the `Action` entity type, requiring the `action` variable in an authorization request to have `Action` type, and disallowing all attributes and tags on action entities.  The Cedar language reserves the `__cedar` entity type, so this entity type, and all entity types with `__cedar` as a component, cannot be used.
+ **An entity identifier \(EID\)** &ndash; The EID lets you reference a specific entity in your policy. The combination of entity type and an EID uniquely identifies an object for Cedar.

   {: .important }
   >This guide includes examples that use simple entity identifiers, such as `jane` or `bob` for the name of an entity of type `User`. This is done to make the examples more readable. However, in a production system it is critical for security reasons that you use unique values that can't be reused.
   >
   > We recommend that you use values like [universally unique identifiers \(UUIDs\)](https://wikipedia.org/wiki/Universally_unique_identifier). For example, if user `jane` leaves the company, and you later let someone else use the name `jane`, then that new user automatically gets access to everything granted by policies that still reference `User::"jane"`.
   >
   > Cedar can't distinguish between the new user and the old. This applies to both principal and resource identifiers. Always use identifiers that are guaranteed unique and never reused to ensure that you don't unintentionally grant access because of the presence of an old identifier in a policy.
   >
   > Where you use a UUID for an entity, we recommend that you follow it with the `//` comment specifier and the 'friendly' name of your entity. This helps to make your policies easier to understand. For example:
   >
   >```cedar
   >principal == User::"a1b2c3d4-e5f6-a1b2-c3d4-EXAMPLE11111", // alice
   >```

+ **Attributes** &ndash; Zero or more attributes that can be of any [data type supported by Cedar](../policies/syntax-datatypes.html). For example, an entity of type `Photo` might contain attributes like a `name` \(a [string](../policies/syntax-datatypes.html#datatype-string)\), a `createdDate` \(a string containing a date\), a `location` \(a [set](../policies/syntax-datatypes.html#datatype-set) of type [Decimal](../policies/syntax-datatypes.html#datatype-decimal) that represent coordinates\), and the `photographer` \(a reference to another entity representing the user who took the photo\). Define the attributes relevant to an entity type as part of your application's schema.

+ **Tags** &ndash; Zero or more tags. Tags are similar to attributes, but they can have key names
which are known only dynamically (at run-time) and not when the policy/schema is authored.

Entities can be grouped into [logical hierarchies](../overview/terminology.html#term-group). You create a hierarchy by specifying a `parent` attribute that points to the group of which the entity is a member. Hierarchies allow you to arrange your entities according to the requirements of your scenario. For example, if your application has an entity that represents a `Photo`, then you can arrange those photos into one or more `Album` groups.

   An entity can have multiple parent entities, and entities can be nested. For example, you could define an `Album` called `trips` that is the parent of another `Album` called `vacations`. That `Album` could then be the parent of several `Photo` entities. A `photo` in the `Vacations` album could at the same time also be in an album named `picturesOfBob`. To do this, you simply designate an additional `parent` attribute to the photo that points to the additional album.

You can use as many types of entities as your scenario requires. We recommend that you define these formally by using a [schema](../overview/terminology.html#term-schema).

This general structure lets Cedar support scenarios where a single entity type can perform in multiple roles. For example, consider a user directory, such as an LDAP system. Such a user directory must support fine-grained permissions to restrict who can read and write the contents of the directory. A policy in such a situation might need to express concepts like the following:

+ Any user can read their own data.
+ Any user who belongs to the Human Resources department can update the information for any other users.

In these scenarios, both the principal and the resource can be the same type of entity, or even the same user.

```cedar
// Allow every user to read their own data in the user directory
permit (
    principal,
    action == Action::"readUser",
    resource
)
when {
    principal == resource // The same entity
};
```

This example allows any principal to perform the `readUser` action on any resource, as long as the `principal` and the `resource` in the request are the same entity.

Except for action entities, which are prefixed with the reserved entity type `Action`, there is no way to distinguish whether an entity should behave as a principal, resource, or both without additional context. You can use the schema to constrain how an entity type can be used.

## Operators {#entity-operators}

Entities support the following operators in a Cedar policy:

+ **Equality** &ndash; Using the `==` operator, you can compare two entities to see if they are the same. Equality in this context means that they are literally the same entity and have the same unique entity identifier. For more information, see [`==` equality operator](../policies/syntax-operators.html#operator-equality).
+ **Hierarchy / membership** &ndash; Using the `in` operator, you can determine if one entity is a descendant of (or a member of) another entity's hierarchy. For more information, see [`in` operator](../policies/syntax-operators.html#operator-in).
+ **Attribute presence** &ndash; Using the [`has` operator](../policies/syntax-operators.html#operator-has), you can determine if the entity has a specific attribute. You can use this operator to ensure that an attribute is present before attempting to access its value. If you attempt to access an attribute that doesn't exist for the specified entity, it generates an error.
+ **Attribute access** &ndash; Using the `.` operator, you can retrieve the value of one of the entity's attributes using the syntax `entityName.attributeName`. You can define the attributes supported by your entities as part of the [schema](../schema/schema.html).
+ **Tag presence** &ndash; Using the [`.hasTag()` method](../policies/syntax-operators.html#operator-hasTag), you can determine that a tag is present before attempting to access its value. If you attempt to access a tag that doesn't exist for the specified entity, it generates an error.
+ **Tag access** &ndash; Using the [`.getTag()` method](../policies/syntax-operators.html#operator-getTag), you can retrieve the value of one of the entity's tags. The type of this
value is defined in the [schema](..schema/schema.html).

## Namespaces {#entity-namespace}

An entity can also be referenced in the context of multiple namespaces. This capability lets you infer a logical hierarchy of entity types. For example, `PhotoFlash::Groups::Album::"vacation"` refers to a specific entity with an entity ID of `"vacation"` and an entity type of `PhotoFlash::Groups::Album`. There is no real structure behind such a string, only what is logically inferred by the designer. The Cedar language reserves all namespaces containing the reserved identifier `__cedar`, so you cannot have an entity `__cedar::Album::"vacation"`. You can create a [namespace](../schema/schema.html#schema-namespace) for an entity type when you define a schema.

## Attributes of entities {#entity-attribute}

An attribute is an additional detail about an entity. For example, a user typically has a name. An employee in a company can have an assigned department. A photo can have a description.

Attributes are referenced by using dot operator notation \(`entity.attribute`\), as shown by the following examples.

```cedar
SomeUser.name                  // SomeUser is an entity of type user
SomeEmployee.department        // SomeEmployee is an entity of type employee
SomePhoto.description          // SomePhoto is an entity of type photo.
```

Alternatively, you can reference an entity's attributes by using indexing notation \(`entity["attribute"]`\), as shown by the following examples which are equivalent to the preceding examples.

```cedar
SomeUser["name"]
SomeEmployee["department"]
SomePhoto["description"]
```

An attribute resolves to a value of a [supported datatype](../policies/syntax-datatypes.html). The attribute can be referenced anywhere that a value of that datatype is valid.

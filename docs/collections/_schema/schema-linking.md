---
layout: default
title: Schema Linking
nav_order: 5
---

# Schema linking {#schema-linking}
{: .no_toc }

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

Starting with Cedar version 4.6, we introduced external entity types and actions.
This allows a schema to declare entity types and actions without defining them.
Schemas can resolve their external declarations by *linking* to other schemas that contain the corresponding definitions.

Linking takes any number of schemas and resolves each `external` declaration against a definition of the same name.
The output of linking is another schema that may contain unresolved external declarations.
The result does not depend on the order of the schemas, or on how they are grouped.

## Linking schemas {#linking-linking}

Linking combines schemas and resolves external declarations
with concrete definitions.

In the following example, the `Documents` schema declares `User`, and the `Users` schema defines it.

**`Documents` schema**

```cedarschema
external entity User;
entity Document {
    owner: User,
};
```

**`Users` schema**

```cedarschema
entity User;
```

**Linked result**

```cedarschema
entity Document {
    owner: User,
};
entity User;
```

Schemas can also resolve each other's declarations, as below:

**`Documents` schema**

```cedarschema
external entity User;
entity Document {
    owner: User,
};
```

**`Users` schema**

```cedarschema
external entity Document;
entity User {
    lastRead: Document,
};
```

**Linked result**

```cedarschema
entity Document {
    owner: User,
};
entity User {
    lastRead: Document,
};
```

external declarations stay external when none of the linked schemas define it.

**`Documents` schema**

```cedarschema
external entity User;
entity Document {
    owner: User,
};
```

**`Folders` schema**

```cedarschema
external entity User;
entity Folder {
    owner: User,
};
```

**Linked result**

```cedarschema
external entity User;
entity Document {
    owner: User,
};
entity Folder {
    owner: User,
};
```

An external action is resolved the same way.

**`Readers` schema**

```cedarschema
entity User;
entity Document;
external action viewDocument;
```

**`Actions` schema**

```cedarschema
external entity User;
external entity Document;
action viewDocument appliesTo {
    principal: User,
    resource: Document,
};
```

**Linked result**

```cedarschema
entity Document;
entity User;
action viewDocument appliesTo {
    principal: User,
    resource: Document,
};
```

## Linking enumerated entity types {#linking-enums}

Enumerated entity type definitions can be merged across partial schemas.
Unlike ordinary entity types, an enumerated entity type cannot be declared `external` and resolved by linking.
Each definition of the enumerated entity type must provide its possible EIDs.

When multiple schemas define the same enumerated entity type, their possible EIDs must agree.
The EIDs are compared as a set, so the definitions may list the values in different orders:

**First schema**

```cedarschema
entity DocumentType enum ["contract", "invoice"];
```

**Second schema**

```cedarschema
entity DocumentType enum ["invoice", "contract"];
```

If the definitions contain different possible EIDs, linking fails with an enum values mismatch error.
For example, `enum ["contract"]` cannot be linked with `enum ["invoice"]`.

## Linking entity types with ancestors {#linking-ancestors}

External entity types may declare parents, and linking combines them.

**`Documents` schema**

```cedarschema
external entity Account;
external entity Folder in Account;
```

**`Shares` schema**

```cedarschema
external entity Team;
external entity Folder in Team;
```

**Linked result**

```cedarschema
external entity Account;
external entity Team;
external entity Folder in [Account, Team];
```

To avoid unsound validation behavior caused by linking,
schema linking requires the ancestors of every *defined* entity type to remain unchanged after linking.

In the following example, `Document` is defined with `Folder` as its only ancestor. The `Shares` schema then places an `Account` above `Folder`, which would make `Account` an ancestor of `Document` as well. That would change a definition, so the link fails.

**`Documents` schema**

```cedarschema
external entity Folder;
entity Document in Folder;
```

**`Shares` schema**

```cedarschema
external entity Account;
external entity Folder in Account;
```

An external entity type can have an enumerated entity type as a parent or ancestor.
For example, the following partial schemas link successfully because both define `Group` with the same EIDs and the definition of `User` preserves its declared parent:

**First schema**

```cedarschema
entity Group enum ["admins", "readers"];
external entity User in Group;
```

**Second schema**

```cedarschema
entity Group enum ["admins", "readers"];
entity User in Group;
```

The linked schema defines `User` as a member of `Group`. `Group` is the enumerated parent, not the definition that resolves `external entity User`.

## Linking actions with ancestors {#linking-ancestors-actions}

Unlike the case of entity types, when linking schemas, all declarations of the same action must declare the same ancestors.

For example, linking the following schemas results in an error because the parents of `viewDocument` do not match.

**`Documents` schema**

```cedarschema
external action viewDocument;
```

**`Shares` schema**

```cedarschema
external action readActions;
external action viewDocument in readActions;
```

## Validation using external declarations {#linking-partial}

A schema with external declarations is still useful for validation.

A schema can:
+ Validate an entity of a defined type, even when its attributes, tags, or ancestors refer to external types.
+ Validate an action, external or defined.
+ Validate a request for a defined action.

A schema cannot:
+ Validate policies.
+ Validate an entity of an external type.
+ Validate a request for an external action.

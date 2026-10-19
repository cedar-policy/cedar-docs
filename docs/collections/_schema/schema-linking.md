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

A declaration that no schema defines stays `external`.

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

An external action is resolved the same way. A declaration carries only the action's parents, and the definition supplies its `appliesTo` and context.

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
schema linking requires the ancestors of every *defined* entity type to remain exactly as they were.

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

## Linking actions with ancestors {#linking-ancestors-actions}

Unlike the case of entity types, sound linking of external actions requires the ancestors of an external action to match exactly those of the action it links to.

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
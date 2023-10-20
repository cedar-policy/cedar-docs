---
layout: default
title: Schema format
nav_order: 1
---

# Cedar schema format {#schema}
{: .no_toc }

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

This topic describes the structure of a Cedar schema. To view the formal grammar, see [Schema grammar](../policies/schema-grammar.html).

## Overview {#schema-overview}
A schema is a declaration of the structure of the entity types that you want to support in your application and for which you want Cedar to provide authorization services. Cedar uses [JSON](https://json.org) to define a schema. It bears some resemblance to [JSON Schema](https://json-schema.org/), but unique aspects of the design of Cedar, such as its use of entity types, require some differences. After you define a schema, you can ask Cedar to validate your policies against it to ensure your policies reference the entities and their attributes correctly.

{: .warning }
>If you change your schema, any policies that you validated before the change might no longer be valid. Those policies can then generate errors during authorization queries if you include entities that match the updated schema in your request. 
> Policies that result in errors aren't included in the authorization decision, possibly leading to unexpected results. Therefore, we strongly recommend that you review your policies to see which might be affected by the schema change, and edit those policies so that they accurately reflect the entities that you now include in your evaluation requests.

You can use a schema to define each of the following entities used by your application:

+ **Principals** – The entities that represent the users of your application. In the schema for the example PhotoFlash application, the principals consist of the `user` and `group` entity types. You can define the properties of each principal, such as a name, age, address, or any other characteristic that is important to your application.
+ **Resources** – The entities that your principals can interact with. In the PhotoFlash application, resource entities could include the photo and the album resource types. These resource entities can also include the properties of each resource, such as a photo's name, location where taken, resolution, codec type, and so on.
+ **Actions** – The operations that principals can perform on your resources. These operations include specifying which resource types each action can apply to and which principal types can perform each action. In the PhotoFlash application, actions include viewing photos, sharing photos, and commenting on photos.

Services that use Cedar can use the information provided in the schema to validate the policies you submit to the policy store. This helps prevent your policies from returning incorrect authorization decisions because of errors in policies like incorrectly typed attribute names. For more information about validating your policies, see [Cedar policy validation against schema](../policies/validation.html).

## Schema format {#schema-format}

A schema contains a declaration of one or more namespaces, each of which contains two mandatory JSON objects, `entityTypes` and `actions`. A namespace declaration can optionally include a third object, `commonTypes`, which defines types that can be referenced by the other two objects. We consider the format of namespaces and these three objects next.

## NameSpace {#schema-namespace}

A [namespace](../overview/terminology.html#term-namespaces) declaration identifies and defines a scope for all entity types and actions declared within it. The namespace is a string that uses double colons \(`::`\) as separators between its elements, which must be identifiers. A namespace can be empty (i.e., the empty string).

{: .important }
>The namespace name must be normalized and cannot include any embedded whitespace, such as spaces, newlines, control characters, or comments.  

A namespace declaration contains a comma-separated list of JSON objects within braces `{ }`. The following is an example of a namespace declaration:

A namespace declaration must contain two child elements, and may contain a third, appearing in any order:

+ [`entityTypes`](#schema-entityTypes)
+ [`actions`](#schema-actions)
+ [`commonTypes`](#schema-commonTypes) (optional)

You define the types of your application's principal and resource entities within the `entityTypes` element, and the specific actions in the `actions` element. Principals and resources are separated from actions because actions are defined in the schema as individual discrete elements (each of which has type `Action`), whereas only the `principal` and `resource` entities' *types* are defined. In your entity store you create individual principal and resource entities that have these types. Optionally, you can define type names in `commonTypes` and reference those names as types in the `entityTypes` and `actions` elements of your schema.

The declared namespace is automatically prepended to all types defined within the associated scope. For example, consider the following schema:

```json
{
    "ExampleCo::Database": {
        "entityTypes": {
            "Table": {
                ...
            }
        },
        "actions": {
            "createTable": {
                ...
            }
        }
    }
}
```

Here, the schema is effectively defining the action entity `ExampleCo::Database::Action::"createTable"` and the entity type `ExampleCo::Database::Table`.

You can reference entity types and actions defined in other namespaces of the same schema by using their fully qualified names. For example, here is a schema that declares two namespaces, `ExampleCo::Clients` and `ExampleCo::Furniture`, where the second namespace's entity type `Table` references the first's entity type `Manufacturer`.

```json
{
    "ExampleCo::Clients": {
        "entityTypes": {
            "Manufacturer": { ... }
        },
        "actions": { ... }
    },
    "ExampleCo::Furniture": {
        "entityTypes": {
            "Table": {
                "shape": {
                    "type": "Record",
                    "attributes": {
                        "manufacturer": {
                            "type": "Entity",
                            "name": "ExampleCo::Clients::Manufacturer"
                        }
                    }
                }
            }
        },
        "actions": { ... }
    }
}
```

If you change a declared namespace in your schema you will need to change the entity types appearing in your policies and/or in other namespaces declared in your schema to instead reference the changed namespace.

## `entityTypes` {#schema-entityTypes}

A collection of the `principal` and `resource` entity types supported by your application. The `entityTypes` element contains a comma-separated list of JSON objects.

The high-level structure of an `entityTypes` entry looks like the following example.

```json
"entityTypes": {
    "EntityTypeName1": {
        "memberOfTypes": [ "parentGroupTypeName1", "parentGroupTypeName2", … ],
        "shape": { … }
    },
    "EntityTypeName2": {
        "memberOfTypes": [ "parentGroupTypeName1", "parentGroupTypeName2", … ],
        "shape": { … }
    }
}
```

Each entry in the `entityTypes` is a JSON object with the following properties.

### Entity type name {#schema-entitytypes-name}

Specifies the name of the entity type as a string. This type name must be an identifier, which is defined in the Cedar grammar as a sequence of alphanumeric characters, omitting any Cedar reserved words.  

{: .important }
>The entity type name must be normalized and cannot include any embedded whitespace, such as spaces, newlines, control characters, or comments.  

```json
"My::Name::Space": {
    "entityTypes": {
        "UserGroup": { ... }  // New entity type name
    }
}
```

This type name is qualified by its [namespace](#schema-namespace) to form a fully qualified entity type which must be used when referencing this type in a policy.

```json
"My::Name::Space::UserGroup"
```

### `memberOfTypes` {#schema-entitytypes-memberOf}

Specifies a list of entity types that can be direct parents of entities of this type. Values in this list must be valid entity type names declared in the schema. If the `memberOfTypes` element is empty or not defined, then entities of that entity type can't have any parents in the entity hierarchy. The following example shows that an entity of type `User` can have parents of type `UserGroup`.

```json
"entityTypes": {
    "UserGroup": {
        … 
    },
    "User": {
        "memberOfTypes": [ "UserGroup" ],
        …
    }
}
```

If the parent type is part of the same namespace as the child type, then you can reference simply the parent type's name. If the parent type is in a different namespace than the child type, then you must include the parent type's namespace as part of the reference. The following example references two parent types, both named `UserGroup`. The first `UserGroup` is part of the same namespace as the child entity type that this entry is part of. The second `UserGroup` is defined in the namespace `Aws::Cognito::UserPool_1`.

```json
"memberOfTypes": [ 
    "UserGroup",
    "Aws::Cognito::UserPool_1::UserGroup"
]
```

### `shape` {#schema-entitytypes-shape}

Specifies the shape of the data stored in entities of this type. The `shape` element, if present, must have type `Record`, and be accompanied by a description of the entity's attributes. The following example shows a simple specification of the `User` entity type.

```json
"User" : {
    "shape" : {
        "type" : "Record",
        "attributes" : {
            "name" : {
                "type" : "String"
            },
            "age" : {
                "type" : "Long"
            }
        }
    }
}
```

Each attribute in the `attributes` portion of the `shape` record must follow the format described next.

Note that if the `shape` element is omitted, then entities of the type being defined are assumed to have no data stored with them. This is equivalent to specifying a `Record` with `{}` for its attributes.

### Attribute specifications {#schema-attributes-specs}

Each attribute in a `Record` is a JSON object that describes one attribute in the record associated with entities of this type. It has the form

```json
    "name" : {
        "type" : "Type"
    },
```

where `name` is the name of the attribute, and `Type` is one of the [Cedar supported data types](../policies/syntax-datatypes.html), discussed in detail below.

You can choose to specify whether an attribute is required or optional. By default, attributes that you define are required. This means that policies that reference this type can assume that the attribute is always present. You can make an attribute optional by adding `"required": false` to the attribute description. Here is an example:

```json
"jobLevel": { 
    "type": "Long",
    "required": false
},
```

A policy should check for an optional attribute's presence by using the [`has`](../policies/syntax-operators.html#operator-has) operator before trying to access the attribute's value. If evaluation of a policy results in an attempt to access a non-existent attribute, evaluation fails with an error (which causes the policy to be ignored during authorization, and for a diagnostic to be generated). The validator will flag the potential for such errors to occur.

You can choose to explicitly declare that an attribute is mandatory by including `"required": true` (but this is unnecessary as mandatory attributes are the default).

### Attribute types {#schema-attributes-types}

Attributes' `type` components can be `"String"`, `"Long"`, `"Boolean"`, `"Record"`, `"Set"`, `"Entity"`, or `"Extension"`. The first three require no further information to be specified. The latter four are described below.

#### `Record` {#schema-entitytypes-shape-record}
{: .no_toc }

A record attribute has the same JSON format as the [entity `shape`'s record's attributes](#schema-attributes-specs). As an example, the following refactors the `User` entity specification above to have a `features` attribute that is a `Record` containing some of the user's physical features.

```json
"User" : {
    "shape" : {
        "type" : "Record",
        "attributes" : {
            "name" : {
                "type" : "String"
            },
            "features" : {
                "type": "Record",
                "attributes": {
                    "age" : {
                        "type" : "Long"
                    },
                    "height": {
                        "type" : "Long"
                    },
                    "eyecolor": {
                        "type": "String"
                    }
                }
            }
        }
    }
}
```

#### `Entity` {#schema-entitytypes-shape-entity}
{: .no_toc }

For attributes of type `"Entity"`, you must also specify a `name` that identifies the entity type of this attribute. The entity type must be defined in the schema. For example, a resource entity might require an `Owner` element that specifies a `User`.

```json
"Document" : {
    "shape" : {
        "type" : "Record",
        "attributes" : {
            "Owner": {
                "type": "Entity",
                "name": "User"
            }
        }
    }
}
```

#### `Set` {#schema-entitytypes-shape-set}
{: .no_toc }

For attributes with type `"Set"`, you must also specify an `element` that defines the properties of the members of the set. Each element is a JSON object that describes what each member of the set looks like.

An `element` must contain a structure formatted according to the same rules as an attribute. As an example, consider the following `Admins` entry which could be part of the `shape` record of an `Account` entity type. This `Admins` element is a set of entities of type `User` and could be used to define which users have administrator permissions in the account.

```json
"Group" : {
    "shape" : {
        "type" : "Record",
        "attributes": {
            "Admins": {
                "type": "Set",
                "element": {
                    "type": "Entity",
                    "name": "User"
                }
            }
        }
    }
}
```

#### `Extension` {#schema-entitytypes-shape-extension}
{: .no_toc }

For attributes of type `"Extension"`, you must also specify the `name` of the specific extension type.
There are two extension types: `ipaddr` for IP address values, and `decimal` for decimal values.
For example, a `Network` entity may include the IP address of its gateway.

```json
"Network": {
    "shape": {
        "type": "Record",
        "attributes": {
            "gateway": {
                "type": "Extension",
                "name": "ipaddr"
            }
        }
    }
}
```

## `actions` {#schema-actions}

A collection of the `Action` entities usable as actions in authorization requests submitted by your application. The `actions` element contains a comma-separated list of one or more JSON objects.

The high-level structure of an `actions` entry looks like the following.

```json
"actions": {
    "ActionName1": {
        "memberOf": ["ActionGroupName1",...],
        "appliesTo": {
            "principalTypes": ["PrincipalEntityType1",...],
            "resourceTypes": ["ResourceEntityType1",...],
        }
    },
    "ActionName2": { ... },
    ...
}
```

You can add as many actions as your application requires.

### Action name {#schema-actions-name}

Specifies the identifier for the action entity, as a string. The name of the action isn't a value but the heading for its own JSON object. Since this is an [entity identifier](../policies/syntax-entity.html#entity-overview) (rather than an entity type, as in the `entityTypes` section) it can contain anything that would be valid inside a Cedar string.

```json
"actions": {
    "ViewPhoto": {
        ...
    },
    "ListPhotos": {
        ...
    },
    ...
}
```

You can then refer to these actions in your policies by using the following syntax. If the schema declares a namespace, then the entity type `Action` is qualified by that namespace.

```cedar
MyApplicationNameSpace::Action::"ViewPhoto"
```

### `memberOf` {#schema-actions-memberOf}

Specifies a list of action entity groups the action is a member of. The `memberOf` component is optional. If omitted, it means the action is a member of no action groups.

The following schema snippet shows an action named `viewAlbum` that is a member of the action group called `viewImages`.

```json
"actions": {
    "viewAlbum": { 
        … 
        "memberOf": [ 
            {
                "id": "viewImages",
                "type": "PhotoFlash::Images::Action"
            },
        ],
        …        
    }
}
```

Action groups are themselves actions, and thus must also be defined in the schema in the `actions` section; we'll see an example of that below.

### `appliesTo` {#schema-actions-appliesTo}

Specifies a JSON object containing two lists, `principalTypes` and `resourceTypes`, which contain the principal and resources entity types, respectively, that can accompany the action in an authorization request.

+ If the `principalTypes` component is omitted from the `appliesTo` element, then an authorization request with this action can have a principal entity of *any* type, or the unspecified entity. The same is true for `resourceTypes`, for a request's resource component. If the `appliesTo` component is omitted entirely, it's the same as if it were present with both `principalTypes` and `resourceTypes` components omitted (i.e., a request can have both principal and resource entities of any type, or leave them unspecified).

+ If either the `principalTypes` or `resourceTypes` components is given with an empty list `[]`, the associated action is not permitted in an authorization request with *any* entities of that category. This effectively means that the action will not be used in an authorization request at all. This makes sense for actions that act as groups for other actions.

The following example `actions` snippet shows three actions. The first action, `read`, is an action group for the other two. It cannot appear in an authorization request because its `principalTypes` and `resourceTypes` components are `[]`. The second action, `viewPhoto`, is a member of the `read` action group, and expects that any request with this action will have a principal entity of type `User` and a resource entity of type `Photo`. The third action, `listAlbums`, also a member of the `read` group, expects that a request with that action will have a principal entity of type `User` and a resource entity of type `Account`. Notice that for both of the latter two actions, the group membership only requires giving the ID of the action -- `"read"` -- and not the type. This is because the validator knows that all action groups must have type `Action`, and by default the action will be within the current namespace. To declare membership in an action group in a different namespace you need to include `"type": "My::NameSpace::Action"` alongside the `"id"` portion, where `My::NameSpace` is the different namespace.

```json
"actions": {
    "read": {
        "appliesTo": {
            "principalTypes": [],
            "resourceTypes": []
        }
    },
    "viewPhoto": {
        "memberOf": [
            {
                "id": "read"
            }
        ],
        "appliesTo": {
            "principalTypes": [ "User" ],
            "resourceTypes": [ "Photo" ]
        }
    },
    "listAlbums": {
        "memberOf": [
            {
                "id": "read"
            }
        ],
        "appliesTo": {
            "principalTypes": [ "User" ],
            "resourceTypes": [ "Account" ]
        }
    }
}
```

### `context` {#schema-actions-context}

Specifies a JSON object in the same format as an entity's `shape` property, which defines the attributes that can be present in the context record in authorization requests made with this action. Specifying a `context` enables Cedar to validate policies that attempt to reference the `context` record's attributes.

Each `context` entry consists of `type` and `attributes` objects. The `type` object is always the type `Record`. The `attributes` object has the same JSON format as the [entity `shape`'s record's attributes](#schema-attributes-specs). For example, the following `context` snippet specifies that any request to perform the `SomeAction` action must include a `Boolean` attribute named `field1` and a `Long`attribute named `field2`. Optionally, the `context` may include a third attribute `field3` which, if present, is a `String`. The `context` entry is optional, and if excluded it is assumed to be an empty `Record` (in which case policies that try to access attributes in `context` will produce validation errors).

```json
"actions": {
    "SomeAction": {
        "appliesTo": {
            "principalTypes": [ ... ],
            "resourceTypes": [ ... ],
            "context": {
                "type": "Record",
                "attributes": {
                    "field1": { "type": "Boolean" },
                    "field2": { "type": "Long" },
                    "field3": { "type": "String",
                                "required": false }
                }
            }
        }
    }
}
```

## `commonTypes` {#schema-commonTypes}

Your schema might define several entity types that share a lot of elements in common. Instead of redundantly entering those elements separately for each entity that needs them, you can define those elements once using a `commonTypes` construct with a name, and then reference that construct's name in each entity that requires them. You can use this anywhere you can define a Cedar type that includes a data type specification and a set of attributes.

### Motivation

Suppose your schema defines several entity types or action entities that share a lot of elements in common. For example, consider the following actions: both `view` and `upload` have identical `context` components.

```json
"actions": {
    "view": {
        "appliesTo": {
            "context": { 
                "type": "Record",
                "attributes": {
                    "ip": { "type": "Extension", "name": "ipaddr" },
                    "is_authenticated": { "type": "Boolean" },
                    "timestamp": { "type": "Long" }
                }
            }
        }
    },
    "upload": {
        "appliesTo": {
            "context": { 
                "type": "Record",
                "attributes": {
                    "ip": { "type": "Extension", "name": "ipaddr" },
                    "is_authenticated": { "type": "Boolean" },
                    "timestamp": { "type": "Long" }
                }
            }
        }
    }
}
```

Instead of redundantly entering common type elements separately for each action / entity type that needs them, you can define them once within `commonTypes`, and then refer to the definition in multiple places.

### Structure

Each JSON object within `commonTypes` consists of the name of a type being defined and its associated definition. The definition is specified just like an [attribute type specification](#schema-attributes-specs), i.e.,

```json
  "TypeName": {
    // attribute type specification
  }
```

Returning to our motivating example, we can define a record type called `ReusedContext`, which is then referenced by the `view` and `upload` actions.

```json
...
"commonTypes": {
    "ReusedContext": {
        "type": "Record",
        "attributes": {
            "ip": { "type": "Extension", "name": "ipaddr" },
            "is_authenticated": { "type": "Boolean" },
            "timestamp": { "type": "Long" }
        }
    }
},
"actions": {
    "view": {
          "appliesTo": {
                "context": { "type": "ReusedContext" }
          }
    },
    "upload": {
        "appliesTo": {
            "context": { "type": "ReusedContext" }
        }
    }
}
```

We can also use type names defined in `commonTypes` within definitions in the `entityTypes` section. As a simple example, here we define a type `name` as a `String`, and then use the type (twice) in the `User` entity type's `attributes` specifications:

```json
...
"commonTypes": {
    "name": {
        "type": "String",
    }
},
"entityTypes": {
    "User": {
        "shape": {
            "type": "Record",
            "attributes": {
                "firstName": {
                    "type": "name"
                },
                "lastName": {
                    "type": "name"
                }
            }
        }
    }
}
```

As another example, we can use a defined record type for the `shape` of multiple entity types. In particular, we collect a set of attributes as a record named `Person` and use `Person` within the `Employee` and `Customer` entity type definitions.

```json
...
"commonTypes": {
    "Person": {
        "type": "Record",
        "attributes": {
            "age": {"type": "Long"},
            "name": {"type": "String"}
        }
    }
},
"entityTypes": {
    "Employee": { "shape": { "type": "Person" } },
    "Customer": { "shape": { "type": "Person" } }
}
```

If you then send an `Employee` entity as the principal in an authorization request, you could evaluate the attributes of that principal by using syntax similar to this example: `principal.age`.

Note that definitions of types appearing in `commonTypes` cannot refer to one another. For example, if both `name` and `Person` from the above example were in the same `commonTypes` section, you could not change `Person`'s define to refer to objects of type `name`.

## Example schema {#schema-examples}

The following schema is for a hypothetical application called PhotoFlash.

The schema defines a `User` entity that can have a `department` and a `jobLevel`. The user can be a member of a `UserGroup`.

The schema also defines the following three resource types:

+ An `Account` can have one `owner` and zero or more `admins` that are all `User` entities.
+ An `Album` can be nested inside another `Album`, and has a Boolean `private` attribute, and a reference to an `Account`.
+ A `Photo` can be placed in an `Album`, and also has a `private` attribute and a reference to an `Account`.

```json
{
    "PhotoFlash": {
        "entityTypes": {
            "User": {
                "memberOfTypes": [ "UserGroup" ],
                "shape": {
                    "type": "Record",
                    "attributes": {
                        "department": { "type": "String" },
                        "jobLevel": { "type": "Long" }
                    }
                }
            },
            "UserGroup": { },
            "Photo": {
                "memberOfTypes": [ "Album" ],
                "shape": {
                    "type": "Record",
                    "attributes": {
                        "private": { "type": "Boolean" },
                        "account": {
                            "type": "Entity",
                            "name": "Account"
                        }
                    }
                }
            },
            "Album": {
                "memberOfTypes": [ "Album" ],
                "shape": {
                    "type": "Record",
                    "attributes": {
                        "private": { "type": "Boolean" },
                        "account": {
                            "type": "Entity",
                            "name": "Account"
                        }
                    }
                }
            },
            "Account": {
                "memberOfTypes": [],
                "shape": {
                    "type": "Record",
                    "attributes": {
                        "owner": {
                            "type": "Entity",
                            "name": "User"
                        },
                        "admins": {
                            "required": false,
                            "type": "Set",
                            "element": {
                                "type": "Entity",
                                "name": "User"
                            }
                        }
                    }
                }
            }
        },
        "actions": {
            "viewPhoto": {
                "appliesTo": {
                    "principalTypes": [ "User" ],
                    "resourceTypes": [ "Photo" ],
                    "context": {
                        "type": "Record",
                        "attributes": {
                            "authenticated": { "type": "Boolean" }
                        }
                    }
                }
            },
            "listAlbums": {
                "appliesTo": {
                    "principalTypes": [ "User" ],
                    "resourceTypes": [ "Account" ],
                    "context": {
                        "type": "Record",
                        "attributes": {
                            "authenticated": { "type": "Boolean" }
                        }
                    }
                }
            },
            "uploadPhoto": {
                "appliesTo": {
                    "principalTypes": [ "User" ],
                    "resourceTypes": [ "Album" ],
                    "context": {
                        "type": "Record",
                        "attributes": {
                            "authenticated": { "type": "Boolean" },
                            "photo": {
                                "type": "Record",
                                "attributes": {
                                    "file_size": { "type": "Long" },
                                    "file_type": { "type": "String" }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
```

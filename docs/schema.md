---
layout: default
title: Schema format
nav_order: 6
---

# Cedar schema format<a name="schema"></a>
{: .no_toc }

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Overview<a name="schema-overview"></a>
A schema is a declaration of the structure of the entity types that you want to support in your application and for which you want Cedar to provide authorization services. Cedar uses [JSON](https://json.org) to define a schema. It bears some resemblance to [JSON Schema](https://json-schema.org/), but unique aspects of the design of Cedar, such as its use of entity types, require some differences.

You can use a schema to define each of the following entities used by your application:
+ **Principals** – The entities that represent the users of your application. In the schema for the example PhotoFlash application, the principals consist of the `user` and `group` entity types. You can define the properties of each principal, such as a name, age, address, or any other characteristic that is important to your application.
+ **Resources** – The entities that your principals can interact with. In the PhotoFlash application, resource entities could include the photo and the album resource types. These resource entities can also include the properties of each resource, such as a photo's name, location where taken, resolution, codec type, and so on.
+ **Actions** – The operations that principals can perform on your resources. These operations include specifying which resource types each action can apply to and which principal types can perform each action. In the PhotoFlash application, actions include viewing photos, sharing photos, and commenting on photos.

Services that use Cedar can use the information provided in the schema to validate the policies you submit to the policy store. This helps prevent your policies from returning incorrect authorization decisions because of errors in policies like incorrectly typed attribute names. For more information about validating your policies, see [Cedar policy validation against schema](validation.md).

A schema contains a declaration of a namespace and two JSON objects: `entityTypes` and `actions`. 


## `namespace`<a name="schema-namespace"></a>

A [namespace](validation.md#validation-namespaces) identifies and defines a scope for all entity types and actions declared within it. The `namespace` is a string that uses double colons \(`::`\) as separators between its elements. A namespace is mandatory and consists of a comma-separated list of JSON objects within braces `{ }`. The following is an example of a `namespace`:

```
"My::Namespace": {
    <JSON object>, 
        ...
    <JSON object>
}
```

A namespace can contain two child elements:
+ ``entityTypes``
+ ``actions``

You define all of your principal types, resource types, and actions that apply to your application in these elements. Principals and resources are separated from actions into different elements because the `principal` and `resource` entities are defined as categories, or *types*. Later, you can instantiate these types as individual principals and resources. Actions are already individual discrete elements rather than types.

## `entityTypes`<a name="schema-entityTypes"></a>

A collection of the `principal` and `resource` entity types supported by your application. The `entityTypes` element contains a comma-separated list of JSON objects.

The high-level structure of an `entityTypes` entry looks like the following example.

```
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

Each entry in the entity is a JSON object with the following properties.

### Entity type name<a name="schema-entitytypes-name"></a>

Specifies the name of the entity type as a string. This type name must be an identifier, which is defined in the Cedar grammar as a sequence of alphanumeric characters, omitting any Cedar reserved words.  

```
"My::Name::Space": {
    "entityTypes": {
        "UserGroup": { ... }  // New entity type name
    }
}    
```

This type name is qualified by its [namespace](#schema-namespace) to form a fully qualified entity type which must be used when referencing this type in a policy.

```
"My::Name::Space::UserGroup"
```

### `memberOfTypes`<a name="schema-entitytypes-memberOf"></a>

Specifies a list of entity types that can be direct parents of entities of this type. Values in this list must be valid entity type identifiers declared in the schema. If the `memberOfTypes` element is empty or not defined, then entities of that entity type can't have any parents in the entity hierarchy. The following example shows that an entity of type `User` can be a member of a parent `UserGroup`.

```
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

```
"memberOfTypes": [ 
    "UserGroup",
    "Aws::Cognito::UserPool_1::UserGroup"
]
```

### `shape`<a name="schema-entitytypes-shape"></a>

Specifies the data type and attributes that are needed to define entities of this type. 

A `shape` must include a `type` specification, with a value that names one of the [Cedar supported data types](syntax-datatypes.md). The following example shows a simple shape.

```
"Age": {
    "shape": {
        "type": "Long" 
    }
}
```

If an entity type needs to be a more complex structure instead of a simple value, then you can define the element as being of one of the types [Record](#schema-entitytypes-shape-record), [Set](#schema-entitytypes-shape-set), or [Entity](#schema-entitytypes-shape-entity).

A `shape` element can be mandatory or optional. If mandatory, then policies that reference this type can assume that the attribute is always present. If optional, then a policy should check or the attribute's presence by using the [has](syntax-operators.md#operator-has) operator before trying to access the attribute's value. If evaluation of a policy results in an attempt to access a non-existent attribute, Cedar generates an exception.

{: .note }
>By default, attributes that you define are mandatory. You can make an attribute optional by adding `"required": false` to the attribute. The following example shows an attribute called `jobLevel` that is an optional attribute for whatever entity it's part of. You can also explicitly declare that an attribute is mandatory by including `"required": true` to the shape.
>```
>"jobLevel": { 
>    "type": "Long",
>    "required": false
>},
>```

#### `Record`<a name="schema-entitytypes-shape-record"></a>
{: .no_toc }

Use the type `Record` when an entity's shape must include multiple attributes that are of different types. For pieces of a `shape` that are marked `"type": "Record"`, you must also specify an `attributes` element that defines each of the attributes of the entity. Each attribute is a JSON object that describes one piece of information about entities of this type. For example, the following describes an entity type that represents an `Employee` in the company. Each employee entity must have a `jobLevel`, an employee `id`, an email or sign-in `alias`, and an optional value that tracks the `numberOfLaptops` assigned to the employee.

```
"Employee": {
    "shape": {
        "type": "Record",
        "attributes": {
            "jobLevel": { "type": "Long" },
            "id": { "type": "Long" },
            "alias": { "type": "String" },
            "numberOfLaptops": {
                "required": false,
                "type": "Long"
            }
        }
    }
}
```

#### `Set`<a name="schema-entitytypes-shape-set"></a>
{: .no_toc }

For pieces of a shape that are marked `"type": "Set"`, you must also specify an `element` that defines the properties of the members of the set. Each element is a JSON object that describes what each member of the set looks like.

An `element` must contain the structure with the same rules as a `shape`. As an example, consider the following `Admins` entry which could be part of the `shape` of an `Account` entity type. This `Admins` element is a set of entities of type `User` and could be used to define which users have administrator permissions in the account.

```
"Admins": {
    "type": "Set",
    "element": {
        "type": "Entity",
        "name": "User"
    }
}
```

#### `Entity`<a name="schema-entitytypes-shape-entity"></a>
{: .no_toc }

For pieces of a shape that are marked `"type": "Entity"`, you must also specify a `name` that identifies the entity type of this attribute. The type must be defined in the schema. For example, a resource entity might require an `Owner` element that specifies a `User`.

```
"Owner": {
    "type": "Entity",
    "name": "User"
}
```

## `actions`<a name="schema-actions"></a>

A collection of the actions that are supported by your application. An action is some type of operation that must be authorized before a user can perform it. The `actions` element contains a comma-separated list of one or more JSON objects.

The high-level structure of an `actions` entry looks like the following example.

```
"actions": {
    "ActionName1": {
        "attributes": {},
        "memberOf": ["ActionGroupName1", "ActionGroupName2"],
        "appliesTo": {
            "principalTypes": [],
            "resourceTypes": [],
            "context": {}
        },
        "ActionName2": {
            "something": "something"
        }
    }
}
```

You can add as many actions as your application requires.

### Action name<a name="schema-actions-name"></a>

Specifies the identifier for the action as a string. The name of the action isn't a value but the heading for its own JSON object. This is an entity identifier rather than an entity type, so it can contain anything that would be valid inside a Cedar string.

```
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

```
MyApplicationNamespace::Action::"ViewPhoto"
```

### `memberOf`<a name="schema-actions-memberOf"></a>

Specifies an identifier for an action that represents an action group. The following schema snippet shows an action named `viewAlbum` that is a member of the action group called `viewImages`.

```
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

### `appliesTo`<a name="schema-actions-appliesTo"></a>

Specifies a JSON object containing two lists, `principalTypes` and `resourceTypes`, which contain the principal and resources entity types that the action can accompany in an authorization request.
+ If the `appliesTo` property or either of the component lists are absent from the `actions` element object, then the action can appear in an authorization request with an entity of *any* type, or with an unspecified entity.
+ Both the `principalTypes` and `resourceTypes` can be empty lists, which means that the associated action can't be used in an authorization request with any entities of that category.

The following example `actions` snippet shows two actions. The first action, `viewPhoto`, requires that a policy evaluating that action must reference a principal of type `User` and a resource of type `Photo`. The second action, `listAlbums`, requires that a policy evaluating that action must reference a principal of type `User` and a resource of type `Account`.

```
"actions": {
    "viewPhoto": {
        "appliesTo": {
            "principalTypes": [ "User" ],
            "resourceTypes": [ "Photo" ]
        }
    },
    "listAlbums": {
        "appliesTo": {
            "principalTypes": [ "User" ],
            "resourceTypes": [ "Account" ]
        }
    }
}
```

### `context`<a name="schema-actions-context"></a>

Specifies a JSON object in the same format as an entity `shape` property, which defines the attributes that can be present in the context record in authorization requests made with this action. It enables the validation of policies to 

Each context entry consists of `type` and `attributes` objects. The `type` object is always of type `Record`. The `attributes` object is a JSON collection of attribute names, each containing a `type` specification for that attribute. For example, the following `context` snippet specifies that any request to perform the `SomeAction` operation must include a test for a Boolean attribute named `field1`. The policy can also test an integer `field2` and a string `field3`, though it's OK if they're not referenced in the policy's context section. Any policy that doesn't include a required attribute in the policy's `context` section fails validation.

```
"actions": {
    "SomeAction": {
        "appliesTo": {
            "principalTypes": [ ... ],
            "resourceTypes": [ ... ],
            "context": {
                "type": "Record",
                "attributes": {
                    "field1": { "type": "Boolean", "required": true },
                    "field2": { "type": "Long" },
                    "field3": { "type": "String" }
                }
            }
        }
    }
}
```

## commonTypes - Reuse of common user-defined types

Your schema might define several entity types that share a lot of elements in common. Instead of redundantly entering those elements separately for each entity that needs them, you can define those elements once using a `commonTypes` contruct with a name, and then reference that construct's name in each entity that requires them. You can use this anywhere you can define a Cedar type that inludes a data type specification and a set of attributes.

For example, consider the following example set of action entities:

```
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
In that example, the `context` element in the `view` and `appliesTo` action is identical.

You can use the `commonTypes` structure in a schema to define one or more blocks of reused elements. You place the `commonTypes` entry in your schema at the same level as the `entityTypes` and `actions` entries.  For example, the following example shows a block of elements called `ReusedContext`. The actions can then use any entries under `commonTypes` by reference, as shown in the following example actions.
```
"commonTypes": {
    "ReusedContext": {
        "type": "Record",
        "attributes": {
            "ip": { "type": "Extension", "name": "ipaddr" },
            "is_authenticated": { "type": "Boolean" },
            "timestamp": { "type": "Long" }
        }
    }
}

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
For this scenarion, you can test for `context.ip`, `context.is_authenticated`, and `context.timestamp` in the `when` and `unless` clauses in policies that reference the `view` and `upload` actions.

As another example, consider a set of attributes that all need to be associated with a type that represents a `Person`. First, collect all of the attributes under a `Person` element in the `commonType` structure.

```
"commonTypes": {
    "Person": {
        "type": "Record",
        "attributes": {
            "age": {"type": "Long"},
            "name": {"type": "String"}
        }
    }
}
```
Then, in the `entityTypes` section, you can add each of these attributes to a new entity type by reference.
```
"entityTypes": {
    "Employee": { "shape": { "type": "Person" } },
    "Customer": { "shape": { "type": "Person" } }
}
```
If you then send an `Employee` entity as the principal in an authorization request, you could evaluate the attributes of that principal by using syntax similar to this example: `principal.age`.

## Example schema<a name="schema-examples"></a>

The following schema is for a hypothetical application called PhotoFlash. 

The schema defines a `User` entity that can have a `department` and a `jobLevel`. The user can be a member of a `UserGroup`. 

The schema also defines the following three resource types:
+ An `Account` can have one `owner` and zero or more `admins` that are all `User` entities.
+ An `Album` can be nested inside another `Album`, and has a Boolean `private` attribute, and a reference to an `Account`.
+ A `Photo` can be placed in an `Album`, and also has a `private` attribute and a reference to an `Account`.

```
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

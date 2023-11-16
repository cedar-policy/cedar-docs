---
layout: default
title: Entities & context JSON syntax
nav_order: 12
has_children: false
---

# Entities and context syntax {#entities-syntax}
{: .no_toc }

When you want to authorize a user request by using the [Authorizer::is_authorized()](https://docs.rs/cedar-policy/latest/cedar_policy/struct.Authorizer.html#method.is_authorized) function, that API requires a list of policies along with the list of entities and a list of other context information that Cedar uses in its evaluation of the request.

To construct that list of entities or context information, the Cedar public API provides functions such as:

+ [Entities::from_json_value()](https://docs.rs/cedar-policy/latest/cedar_policy/struct.Entities.html#method.from_json_value)
+ [Context::from_json_str()](https://docs.rs/cedar-policy/latest/cedar_policy/struct.Context.html#method.from_json_str)

You can use these to construct the required lists from a JSON representation. This topic describes the JSON representation for these lists.

+ [Entities](#entities)
+ [Context](#context)

## Entities

At the top level, Cedar expects a JSON list (an array using `[ ]`) of objects. Each object in this list represents a single entity, and should have three attributes:

+ [`uid`](#uid)
+ [`parents`](#parents)
+ [`attrs`](#attrs)

```json
[
    {
        "uid": {},
        "parents": [],
        "attrs": {}
    },
    {
        ...
    }
]
```

This topic discusses the `attrs` object first.

### `attrs`

Use the `attrs` object to specify the key name and value of each attribute attached to the associated entity. For example, if the schema for type `User` defines `department` and `jobLevel` attributes, then for an individual entity of type `User`, you can specify those attributes as shown here.

```json
"attrs": {
    "department": "HardwareEngineering",
    "jobLevel": 5
}
```

Notice that the `department` attribute has a string value, and the `jobLevel` attribute has an integer value, but these types are not explicitly declared in the JSON format. Cedar automatically converts these primitive JSON types to their Cedar equivalents.

+ JSON string --> [Cedar String](../policies/syntax-datatypes.html#string)
+ JSON integer --> [Cedar Long](../policies/syntax-datatypes.html#long)
+ JSON boolean --> [Cedar Boolean](../policies/syntax-datatypes.html#boolean)
+ JSON list/array --> [Cedar Set](../policies/syntax-datatypes.html#set)
+ JSON object/map --> [Cedar Record](../policies/syntax-datatypes.html#record)

For entity references, Cedar JSON format supports an `__entity` escape, whose value is a JSON object with the attributes `type` and `id`.

```json
"attrs": {
    "department": "HardwareEngineering",
    "jobLevel": 5,
    "manager": {
       "__entity": {
           "type": "User",
           "id": "78EF12"
       }
    }
}
```

You can specify the `__entity` escape explicitly, or leave it implicit. For more information, see [Schema-based parsing](#schema-based-parsing).

The type must be a normalized entity type, i.e., without whitespace or Cedar comments. For instance, the following is not valid:

```json
"type": "User"
```

For [Cedar extension](../policies/syntax-datatypes.html#extension) types and values, the Cedar JSON format supports an `__extn` escape, whose value is a JSON object with the attributes `fn` and `arg`.

The `fn` attribute names a specific Cedar extension function, which is called with the `arg` value to produce the final attribute value. The function name must be normalized, with no whitespace or Cedar comments. The following example shows how to add an IP address attribute using the [Cedar ip extension function](../policies/syntax-operators.html#ip-parse-string-and-convert-to-ipaddr).

```json
"attrs": {
    "department": "HardwareEngineering",
    "jobLevel": 5,
    "home_ip": {
       "__extn": {
           "fn": "ip",
           "arg": "222.222.222.101"
       }
    }
}
```

You can specify the `__extn` escape explicitly, or leave it implicit. For more information, see [Schema-based parsing](#schema-based-parsing).

### `uid`

The `uid` object specifies the Cedar type and unique identifier for the entity. You can explicitly include the `__entity` escape, or leave it implicit. You should reference a Cedar type defined in the schema, and provide a unique, immutable, and non-reusable identifier for the entity. Both of the following are valid and equivalent, and specify an entity of type `User` with the unique identifier of `12UA45`.

```json
"uid": {
    "__entity": {
        "type": "User",
        "id": "12UA45" 
    }
}
```

```json
"uid": {
    "type": "User",
    "id": "12UA45" 
}
```  

### `parents`

The `parents` object identifies other entities that represent containers in a hierarchy, such as a group that can contain users. This object's value is a JSON list that contains entity references. Those entity references take either of the two forms defined for `uid`, with `__entity` either explicitly specified or implied. The following example could be the `parents` entry for a user that is a member of two user groups.

Example:

```json
"parents": [
    { 
        "type": "UserGroup",
        "id": "alice_friends" 
    },
    {
        "type": "UserGroup",
        "id": "bob_friends"
    }    
]
```

### Example

This example pulls together many of the features discussed in the previous sections. It uses `uid`, `attrs`, and `parents`.

For `uid` and `parents` it uses the implicit `__entity` escape rather than explicitly adding it. Of course, a full entities file would also need to include entries for the two `UserGroup` entities which are referenced but not defined in this example.

This example also demonstrates attribute values with entity types (`User`) and extension types (IP address `ip` and `decimal`), and uses the explicit `__entity` and `__extn` escapes for those. It does not rely on [schema-based parsing](#Schema-based parsing).

```json
[
    {
        "uid": { "type": "User", "id": "alice" },
        "attrs": {
            "department": "HardwareEngineering",
            "jobLevel": 5,
            "homeIp": { "__extn": { "fn": "ip", "arg": "222.222.222.7" } },
            "confidenceScore": { "__extn": { "fn": "decimal", "arg": "33.57" } }
        },
        "parents": [
            { "type": "UserGroup", "id": "alice_friends" },
            { "type": "UserGroup", "id": "bob_friends" }
        ]
    },
    {
        "uid": { "type": "User", "id": "ahmad"},
        "attrs" : {
            "department": "HardwareEngineering",
            "jobLevel": 4,
            "manager": { "__entity": { "type": "User", "id": "alice" } }
        },
        "parents": []
    }
]
```

## Context

The `context` input parameter is used to provide details specific to a request, such as the date and time the request was sent, the IP address the request originated from, or whether the user was authenticated using a multi-factor authentication device.

Each entry in this list represents a single piece of context information for the request. Construct each entry in this list using the same syntax as the [`attrs`](#attrs) for entities documented previously in this topic. Context is a record with key and value pairs for each entry.

Just as in [`attrs`](#attrs), the `__entity` and `__extn` escapes can be explicitly shown or left implicit, as shown in the following example.

```json
{
    "source_ip": "ip(\"10.0.1.101\")",
    "expire_time_epoch": "1690482960",
    "authn_mfa": true
}
```

When you need to reference one of the context details in a policy, reference each context entry's key by using dot notation as part of the `context` object, as shown in the following examples that reference the previous three context values.

```cedar
when {
    context.source_ip.isInRange(ip("222.222.222.0/24")) 
}
```

```cedar
when {
    context.expire_time_epoch > currentTime
}
```

```cedar
when {
    context.authn_mfa
}
```

## Schema-based parsing

Cedar supports “schema-based parsing” for entity and context parameters. This allows you to omit the `__entity` and `__extn` escapes as long as the schema indicates to Cedar that the corresponding attribute values are entity references or extension values, respectively. For example:

```json
"attrs": {
    "department": "HardwareEngineering",
    "jobLevel": 5,
    "manager": {
       "type": "User",
       "id": "78EF12"
    },
    "home_ip": {
       "fn": "ip",
       "arg": "222.222.222.101"
    }
}
```

For extension values, the `fn` can be implicit as well. The following example is valid, as long as the schema indicates that `home_ip` is an IP address.

```json
"attrs": {
    "department": "HardwareEngineering",
    "jobLevel": 5,
    "home_ip": "222.222.222.101"
}
```

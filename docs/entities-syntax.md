---
layout: default
title: Entities & Context JSON syntax
nav_order: 12
has_children: false
---


# Entities and context syntax<a name="entities-syntax"></a>
{: .no_toc }

When you want to authorize a user request by using the [Authorizer::is_authorized()](https://docs.rs/cedar-policy/latest/cedar_policy/struct.Authorizer.html#method.is_authorized) function, that API requires a list of policies along with the list of entities and a list of other context information that Cedar uses in its evaluation of the request. 

To construct that list of entities or context information, the Cedar public API provides functions such as  [Entities::from_json_value()](https://docs.rs/cedar-policy/latest/cedar_policy/struct.Entities.html#method.from_json_value) and [Context::from_json_str()](https://docs.rs/cedar-policy/latest/cedar_policy/struct.Context.html#method.from_json_str) that you can use to construct the required lists from a JSON representation. This topic describes that JSON representation.

At the top level, Cedar expects a JSON list (an array using `[ ]`) of objects. Each object represents a single entity or context element, and should have three attributes:

+ [`uid`](#uid)
+ [`parents`](#parents)
+ [`attrs`](#attrs)

```
[
    {
        "uid": {},
        "parents": {},
        "attrs": {}
    },
    {
        ...
    }
]
```

This topic discusses the `attrs` object first.

## `attrs`

Use the `attrs` object to specify the keys and values of attributes attached to the associated entity. For example, if the schema for type `User` defines `department` and `jobLevel` attributes, then for an individual entity of type `User`, you can specify the values as shown here.

```
"attrs": {
    "department": "HardwareEngineering",
    "jobLevel": 5
},
```

Notice that the `department` attribute has a string value, and the `jobLevel` attribute has an integer value, but this is not explicitly marked in the JSON format. Cedar automatically converts these primitive JSON types to their Cedar equivalents.

+ JSON string --> [Cedar String](https://docs.cedarpolicy.com/syntax-datatypes.html#string)
+ JSON integer --> [Cedar Long](https://docs.cedarpolicy.com/syntax-datatypes.html#long)
+ JSON boolean --> [Cedar Boolean](https://docs.cedarpolicy.com/syntax-datatypes.html#boolean)
+ JSON list/array --> [Cedar Set](https://docs.cedarpolicy.com/syntax-datatypes.html#set)
+ JSON object/map --> [Cedar Record](https://docs.cedarpolicy.com/syntax-datatypes.html#record)

For entity references, Cedar JSON format supports an `__entity` escape, whose value is a JSON object with the attributes `type` and `id`.

```
"attrs": {
    "department": "HardwareEngineering",
    "jobLevel": 5,
    "manager": {
       "__entity": {
           "type": "User",
           "id": "78EF12"
       }
    }
},
```

The type must be a normalized entity type, i.e., without whitespace or Cedar comments. For instance, the following is not valid:
```
"type": "User
 "
```

For [Cedar extension](https://docs.cedarpolicy.com/syntax-datatypes.html#extension) types and values, the Cedar JSON format supports an `__extn` escape, whose value is a JSON object with the attributes `fn` and `arg`.

The `fn` attribute names a specific Cedar extension function, which is called with the `arg` value to produce the final attribute value. The function name must be normalized, with no whitespace or Cedar comments. The following example shows how to add an IP address attribute using the [Cedar ip extension function](https://docs.cedarpolicy.com/syntax-operators.html#ip-parse-string-and-convert-to-ipaddr).

```
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

## `uid`

The `uid` object specifies the Cedar type and unique identifier for the entity. You can explicitly include the `__entity` escape, or leave it implicit. You should reference a Cedar type defined in the schema, and provide a unique, immutable, and non-reusable identifier for the entity. Both of the following are valid and equivalent, and specify an entity of type `User` with the unique identifier of `12UA45`.

+ ```
  "uid": {
      "__entity": {
          "type": "User",
          "id": "12UA45" 
      }
  }
  ```  
+ ```
  "uid": {
      "type": "User",
      "id": "12UA45" 
  }
  ```  

## `parents` 

The `parents` object identifies other entities that represent containers in a heirarchy, such as a group that can contain users. This object's value is a JSON list that contains entity references. Those entity references take either of the two forms defined for `uid`, with `__entity` either explicitly specified or implied. The following example could be the `parents` entry for a user that is a member of two user groups.

Example:
```
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

## Schema-based parsing

Cedar supports “schema-based parsing” for entity data and contexts. This allows customers to omit the `__entity` and `__extn` escapes as long as the schema indicates to Cedar that the corresponding attribute values are entity references or extension values, respectively. For example:

```
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

```
"attrs": {
    "department": "HardwareEngineering",
    "jobLevel": 5,
    "home_ip": "222.222.222.101"
}
```

## Example

This example pulls together many of the features discussed in the previous sections. It uses `uid`, `attrs`, and `parents`.

For `uid` and `parents` it uses the implicit `__entity` escape rather than explicitly adding it. Of course, a full entities file would also need to include entries for the two `UserGroup` entities which are referenced but not defined in this example.

This example also demonstrates attribute values with entity types (`User`) and extension types (IP address `ip` and `decimal`), and uses the explicit `__entity` and `__extn` escapes for those. It does not rely on [schema-based parsing](#Schema-based parsing).

```
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

## Final notes

The portion of the just-described format for entity attribute values is also used by some functions for constructing the authorization request context from JSON. For example, by using [Context::from_json_value())](https://docs.rs/cedar-policy/latest/cedar_policy/struct.Context.html#method.from_json_value).

Alternatives to JSON exist for both Entities and Context. For example, you can construct entities and context programmatically using functions such as [Entities::from_entities()](https://docs.rs/cedar-policy/latest/cedar_policy/struct.Entities.html#method.from_entities).

In any case, entities and context are ultimately passed to
[Authorizer::is_authorized()](https://docs.rs/cedar-policy/latest/cedar_policy/struct.Authorizer.html#method.is_authorized) for your authorization requests.

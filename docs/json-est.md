---
layout: default
title: JSON External Syntax Tree
nav_order: 10
has_children: true
---

# JSON External Syntax Tree representation of policies<a name="json-est"></a>
{: .no_toc }

When you want to retrieve and programmatically parse a policy, you can use the `to_json` method. This returns the policy formatted as a JSON structure, as described in this topic.

***Example***
A standard Cedar policy looks like the following:
```
permit(
    principal == User::"12UA45",
    action == Action::"view",
    resource in Folder::"abc"
) when {
    context.tls_version == "1.3"
};
```
When you retrieve the JSON representation of this policy, it looks like the following:
```
{
    "effect": "permit",
    "principal": {
        "op": "==",
        "entity": { "type": "User", "id": "12UA45" }
    },
    "action": {
        "op": "==",
        "entity": { "type": "Action", "id": "view" }
    },
    "resource": {
        "op": "in",
        "entity": { "type": "Folder", "id": "abc" }
    },
    "conditions": [
        {
            "kind": "when",
            "body": {
                "==": {
                    "left": {
                        ".": {
                            "left": {
                                "Var": "context"
                            },
                            "attr": "tls_version"
                        }
                    },
                    "right": {
                        "Literal": "1.3"
                    }
                }
            }
        }
    ]
}
```
{: .note }
>In this topic, the term policy refers to both static policies and policy templates. 

The JSON representation of a policy contains the following keys:
* [effect](#effect)
* [principal](#principal)
* [action](#action)
* [resource](#resource)
* [conditions](#conditions)
* [annotations](#annotations)

# `effect`
The `effect` object is required.

The value of this object must be either the string `permit` or the string `forbid`.
```
    "effect": "permit",
    "effect": "forbid",
```

# `principal`
The `principal` object is required.
The value of this object must include an object with the key `op`, and depending on the value of `op`, an object with the key `entity` or `slot`.

## `op`
The `op` key is mandatory. The `op` object must have one of the following string values:

* `All` 
    If present, then the original policy contains only the key word `principal` with no constraints. In this case, the `principal` object doesn't require any additional objects.
    Example Cedar policy line:
    `"principal"`
    JSON representation:
    ```
    "principal": {
        "op": "All" 
    }
    ```

* `==`  
    If present, then the `principal` object must also have one of the following:
  * [`entity`](#entity)
    Example Cedar policy line:
    `"principal" == User::"12UA45"`
    JSON representation: 
     ```
    "principal": {
        "op": "==",
        "entity": { "type": "User", "id": "12UA45" }
    }
     ```
  
  * [`slot`](#slot)
    Example Cedar policy line:
    `"principal" == "?principal"`
    JSON representation: 
      ```
    "principal": {
        "op": "==",
        "slot": { "?principal" }
    },
      ```

* `in`
If present, then the `principal` object must also have one of the following:
  * [`entity`](#entity)
    Example Cedar policy line:
    `"principal" in Group::"Admins"`
    JSON representation:
    ```
        "principal": {
            "op": "in",
            "entity": { "type": "Group", "id": "Admins" }
        }
    ```
  * [`slot`](#slot)
    Example Cedar policy line:
    `"principal" in "?principal"`
    JSON representation
    ```
        "principal": {
            "op": "in",
            "slot": { "?principal" }
        },
    ```

# `action`
The `action` object is required.
The value of this object must include an object with the key `op`, and depending on the value of `op`, an object with the key `[entity](#entity)` or `[entities](#entities)`.

## `op`
The `op` key is mandatory. The `op` object must have one of the following string values:

* `All` 
    If present, then the original policy contains only the key word `action` with no constraints. In this case, the `action` object doesn't require any additional objects.
    Example Cedar policy line:
    `"action"`
    JSON representation:
    ```
    "action": {
        "op": "All" 
    }
    ```

* `==`  
If present, then the `action` object must also have the following object:
  * [`entity`](#entity)
    Example Cedar policy line:
    `"action" == Action::"readFile"`
    JSON representation: 
     ```
    "action": {
        "op": "==",
        "entity": { "type": "Action", "id": "readFile" }
    }
     ```

* `in`
If present, then the `action` object must also have one of the following:
  * [`entity`](#entity)
    Example Cedar policy line:
    `"action" in Action::"readOnly"`
    JSON representation:
    ```
        "principal": {
            "op": "in",
            "entity": { "type": "Action", "id": "readOnly" }
        }
    ```
  * [`entities`](#entities)
    Example Cedar policy line:
    `"action" in [ Action::"readFile", Action::"writeFile", Action::"deleteFile"]`
    JSON representation
    ```
        "principal": {
            "op": "in",
            "entities": [
                { "type": "Action", "id": "readFile" },
                { "type": "Action", "id": "writeFile" },
                { "type": "Action", "id": "deleteFile" }
            ]
        }
    ```

# `resource`
The `resource` object is required.
The value of this object must include an object with the key `op`, and depending on the value of `op`, an object with the key `entity`.

## `op`
The `op` key is mandatory. The `op` object must have one of the following string values:

* `All`
    If present, then the original policy contains only the key word `resource` with no constraints. In this case, the `resource` object doesn't require any additional objects.
    Example Cedar policy line:
    `"resource"`
    JSON representation:
    ```
    "resource": {
        "op": "All" 
    }
    ```

* `==`  
If this operator is present, then the `resource` object must also have one of the following:
  * [`entity`](#entity)
    Example Cedar policy line:
    `"resource" == file::"vacationphoto.jpg"`
    JSON representation: 
     ```
    "resource": {
        "op": "==",
        "entity": { "type": "file", "id": "vacationphoto.jpg" }
    }
     ```
  
  * [`slot`](#slot)
    Example Cedar policy line:
    `"resource" == "?resource"`
    JSON representation: 
      ```
    "resource": {
        "op": "==",
        "slot": { "?resource" }
    },
      ```

* `in`
If present, then the `resource` object must also have one of the following:
  * [`entity`](#entity)
    Example Cedar policy line:
    `"resource" in folder::"Public"`
    JSON representation:
    ```
        "resource": {
            "op": "in",
            "entity": { "type": "folder", "id": "Public" }
        }
    ```
  * [`slot`](#slot)
    Example Cedar policy line:
    `"resource" in "?resource"`
    JSON representation
    ```
        "resource": {
            "op": "in",
            "slot": { "?resource" }
        },
    ```

# conditions
The `conditions` object is mandatory, and is a JSON array of objects.  Each object in the array must have exactly two keys, `kind` and `body`.  The kind key must be either the string `when` or the string `unless`.

The `body` key must be an [ESTExpr object](#ESTExpr-objects).

# annotations
annotations, if present, must be a JSON object.  The keys and values, which must all be strings, correspond to the Cedar annotation keys and values on the policy.

# entity
This object has a value that specifies the Cedar `type` and unique `id` of a single entity.
```
    "entity": { "type": "User", "id": "12UA45" }
```

# entities
This object is a JSON array or list of objects. Each entry in the list is a  each with a value that specifies the `type` and `id` of the entity.
```
    "entity": [
        { "type": "User", "id": "12UA45" },
        { "type": "Group", "id": "67VB89" }
    ]
```

# slot
This key is mandatory only if the policy being rendered is a template that uses a placeholder and the `principal` or `resource` object uses the `==` or `in` operator. 
  ```
    "slot": "?principal"
    "slot": "?resource"
  ```

## ESTExpr objects
An ESTExpr object is an object with a single key:
* The string `Value`, where the value is a Cedar value in the same syntax as expected for entity attribute values in Cedar’s entity format.  This can include entity reference literals, set literals, and record literals.
* The string `Var`, where the value is one of the strings `principal`, `action`, `resource`, or `context`.
* The string `Slot`, where the value is one of the strings `?principal` or `?resource`. Currently, policies containing this are not valid Cedar
* The string `Unknown`, where the value is an object with a single key name, whose value is the name of the unknown. This is used for partial-evaluation.  In particular, these values may appear in the ESTs of residuals.
* One of the strings `!` or `neg`, where the value is an object with a single key argument, whose value is itself an [ESTExpr object](#ESTExpr-objects).
* One of the strings `==`, `!=`, `in`, `<`, `<=`, `>`, `>=`, `&&`, `||`, `+`, `-`, `*`, `contains`, `containsAll`, or `containsAny`. The value is an object with keys `left` and `right`, which are each themselves an [ESTExpr object](#ESTExpr-objects).
* One of the strings `.` or `has`, where the value is an object with keys `left` and `attr`.  The left key is itself an [ESTExpr object](#ESTExpr-objects), while the `attr` key is any string.
* The string `like`, where the value is an object with keys `left` and `pattern`.  The left key is itself an [ESTExpr object](#ESTExpr-objects), while the `pattern` key is any string.
* The string `if-then-else`, where the value is an object with keys `if`, `then`, and `else`, each of which are themselves an [ESTExpr object](#ESTExpr-objects).
* The string `Set`, where the value is a JSON array of values, each of which is itself an [ESTExpr object](#ESTExpr-objects).
* The string `Record`, where the value is a JSON object whose keys are arbitrary strings and values are themselves [ESTExpr objects](#ESTExpr-objects).
* Any other key: that key is treated as the name of an extension function or method.  The value must be a JSON array of values, each of which is itself an ESTExpr EST object.  Note that for method calls, the method receiver is the first argument.  For example, for `a.isInRange(b)`, the first argument is `a` and the second argument is `b`.


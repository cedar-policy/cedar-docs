---
layout: default
title: Programmatic policy creation using JSON
nav_order: 7
---
<!-- markdownlint-disable-file MD036 -->

# Programmatic policy creation using JSON policy format {#json-format}
{: .no_toc }

You can use the Cedar `Policy::to_json()` method to convert the specified policy into a [JSON](https://json.org) document.

You can also use the `Policy::from_json()` method to convert a JSON document into a new Cedar policy. This gives you another option for programmatically constructing or parsing your policies.

The JSON document format you receive or submit using either of these methods is described in this topic.

***Example***

A "standard" Cedar policy looks like the following:

```cedar
permit (
    principal == User::"12UA45",
    action == Action::"view",
    resource in Folder::"abc"
) when {
    context.tls_version == "1.3"
};
```

When you retrieve the JSON representation of this policy, it looks like the following:

```json
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

{: .note }
>The JSON representation of a Cedar policy does not preserve comments, whitespace, or newline characters.

The JSON representation of a policy contains the following keys:

* [effect](#effect)
* [principal](#principal)
* [action](#action)
* [resource](#resource)
* [conditions](#conditions)
* [annotations](#annotations)

## `effect`

The `effect` object is required.

The value of this object must be either the string `permit` or the string `forbid`.

```json
"effect": "permit",
"effect": "forbid",
```

## `principal`

The `principal` object is required.

The value of this object must include an object with the key `op`, and depending on the value of `op`, an object with the key `entity` or `slot`.

## `op`

The `op` key is required. The `op` object must have one of the following string values:

* `All`

    If present, then the original policy contains only the key word `principal` with no constraints. In this case, the `principal` object doesn't require any additional objects.

    **Example**

    Cedar policy line:

    ```cedar
    principal
    ```

    JSON representation:

    ```json
    "principal": {
        "op": "All" 
    }
    ```

* `==`  
    If present, then the `principal` object must also have one of the following:

  * [`entity`](#entity)

    **Example**

    Cedar policy line:

    ```cedar
    principal == User::"12UA45"
    ```

    JSON representation:

    ```json
    "principal": {
        "op": "==",
        "entity": { "type": "User", "id": "12UA45" }
    }
    ```
  
  * [`slot`](#slot)

    **Example**

    Cedar policy line:

    ```cedar
    principal == ?principal
    ```

    JSON representation:

    ```json
    "principal": {
        "op": "==",
        "slot": { "?principal" }
    },
    ```

* `in`

  If present, then the `principal` object must also have one of the following:

  * [`entity`](#entity)

    **Example**

    Cedar policy line:

    ```cedar
    principal in Group::"Admins"
    ```

    JSON representation:

    ```json
    "principal": {
        "op": "in",
        "entity": { "type": "Group", "id": "Admins" }
    }
    ```

  * [`slot`](#slot)

    **Example**

    Cedar policy line:

    ```cedar
    principal in ?principal
    ```

    JSON representation

    ```json
    "principal": {
        "op": "in",
        "slot": { "?principal" }
    },
    ```

* `is`

  If present, then the `principal` object must also have an `entity_type` key.

  **Example**

  Cedar policy line:

  ```cedar
  principal is User
  ```

  JSON representation:

  ```json
  "principal": {
      "op": "is",
      "entity_type": "User"
  }
  ```

  The `principal` object may also optionally have an `in` key. The value of this key is an object with one of the following:

  * [`entity`](#entity)

    **Example**

    Cedar policy line:

    ```cedar
    principal is User in Group::"Admins"
    ```

    JSON representation:

    ```json
    "principal": {
        "op": "is",
        "entity_type": "User",
        "in": {
            "entity": { "type": "Group", "id": "Admins" }
        }
    }
    ```

  * [`slot`](#slot)

    **Example**

    Cedar policy line:

    ```cedar
    principal is User in ?principal
    ```

    JSON representation

    ```json
    "principal": {
        "op": "is",
        "entity_type": "User",
        "in": {
            "slot": { "?principal" }
        }
    },
    ```

## `action`

The `action` object is required.

The value of this object must include an object with the key `op`, and depending on the value of `op`, an object with the key `[entity](#entity)` or `[entities](#entities)`.

## `op`

The `op` key is required.

The `op` object must have one of the following string values:

* `All`

    If present, then the original policy contains only the key word `action` with no constraints. In this case, the `action` object doesn't require any additional objects.

    **Example**

    Cedar policy line:

    ```cedar
    action
    ```

    JSON representation:

    ```json
    "action": {
        "op": "All" 
    }
    ```

* `==`  

    If present, then the `action` object must also have the following object:

  * [`entity`](#entity)

    **Example**

    Cedar policy line:

    ```cedar
    action == Action::"readFile"
    ```

    JSON representation:

    ```json
    "action": {
        "op": "==",
        "entity": { "type": "Action", "id": "readFile" }
    }
    ```

* `in`

  If present, then the `action` object must also have one of the following:

  * [`entity`](#entity)

    **Example**

    Cedar policy line:

    ```cedar
    action in Action::"readOnly"
    ```

    JSON representation:

    ```json
    "action": {
        "op": "in",
        "entity": { "type": "Action", "id": "readOnly" }
    }
    ```

  * [`entities`](#entities)

    **Example**

    Cedar policy line:

    ```cedar
    action in [ Action::"readFile", Action::"writeFile", Action::"deleteFile"]
    ```

    JSON representation

    ```json
    "action": {
        "op": "in",
        "entities": [
            { "type": "Action", "id": "readFile" },
            { "type": "Action", "id": "writeFile" },
            { "type": "Action", "id": "deleteFile" }
        ]
    }
    ```

## `resource`

The `resource` object is required.

The value of this object must include an object with the key `op`, and depending on the value of `op`, an object with the key `entity` or `slot`.

## `op`

The `op` key is required.

The `op` object must have one of the following string values:

* `All`

    If present, then the original policy contains only the key word `resource` with no constraints. In this case, the `resource` object doesn't require any additional objects.

    **Example**

    Cedar policy line:

    ```cedar
    resource
    ```

    JSON representation:

    ```json
    "resource": {
        "op": "All" 
    }
    ```

* `==`  

  If this operator is present, then the `resource` object must also have one of the following:

  * [`entity`](#entity)

    **Example**

    Cedar policy line:

    ```cedar
    resource == file::"vacationphoto.jpg"
    ```

    JSON representation:

    ```json
    "resource": {
        "op": "==",
        "entity": { "type": "file", "id": "vacationphoto.jpg" }
    }
    ```
  
  * [`slot`](#slot)

    **Example**

    Cedar policy line:

    ```cedar
    resource == ?resource
    ```

    JSON representation:

    ```json
    "resource": {
        "op": "==",
        "slot": { "?resource" }
    },
    ```

* `in`

  If present, then the `resource` object must also have one of the following:

  * [`entity`](#entity)

    **Example**

    Cedar policy line:

    ```cedar
    resource in folder::"Public"
    ```

    JSON representation:

    ```json
    "resource": {
        "op": "in",
        "entity": { "type": "folder", "id": "Public" }
    }
    ```

  * [`slot`](#slot)
  
    **Example**

    Cedar policy line:

    ```cedar
    resource in ?resource
    ```

    JSON representation

    ```json
    "resource": {
        "op": "in",
        "slot": { "?resource" }
    }
    ```

* `is`

  If present, then the `resource` object must also have an `entity_type` key.

  **Example**

  Cedar policy line:

  ```cedar
  resource is file
  ```

  JSON representation:

  ```json
  "resource": {
      "op": "is",
      "entity_type": "file"
  }
  ```

  The `resource` object may also optionally have an `in` key. The value of this key is an object with one of the following:

  * [`entity`](#entity)

    **Example**

    Cedar policy line:

    ```cedar
    resource is file in folder::"Public"
    ```

    JSON representation:

    ```json
    "resource": {
        "op": "is",
        "entity_type": "file",
        "in": {
            "entity": { "type": "Folder", "id": "Public" }
        }
    }
    ```

  * [`slot`](#slot)

    **Example**

    Cedar policy line:

    ```cedar
    resource is file in ?resource
    ```

    JSON representation

    ```json
    "resource": {
        "op": "is",
        "entity_type": "file",
        "in": {
            "slot": { "?resource" }
        }
    },
    ```

## conditions

The `conditions` object is required.

The value of this object is a JSON array of objects.  Each object in the array must have exactly two keys: `kind` and `body`.  

The `kind` key must be either the string `when` or the string `unless`.

The `body` key must be an [JsonExpr object](#JsonExpr-objects).

**Example**

Cedar policy lines

```cedar
when { ... }
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
            ...
        }
    }
]
```

## `annotations`

Annotations, if present, must be a JSON object.  The keys and values, which must all be strings, correspond to the Cedar annotation keys and values on the policy.

## `entity`

This object has a value that specifies the Cedar `type` and unique `id` of a single entity.

```json
"entity": { "type": "User", "id": "12UA45" }
```

## `entities`

This object is a JSON array or list of objects. Each entry in the list is a  each with a value that specifies the `type` and `id` of the entity.

```json
"entities": [
    { "type": "User", "id": "12UA45" },
    { "type": "Group", "id": "67VB89" }
]
```

## `slot`

This key is required only if the policy being rendered is a template that uses a placeholder and the `principal` or `resource` object uses the `==` or `in` operator.

```json
"slot": "?principal"
"slot": "?resource"
```

## JsonExpr objects {#JsonExpr-objects}

An JsonExpr object is an object with a single key that is any of the following.

+ [`Value`](#JsonExpr-Value)
+ [`Var`](#JsonExpr-Var)
+ [`Slot`](#JsonExpr-Slot)
+ [`Unknown`](#JsonExpr-Unknown)
+ [`!` or `neg` operators](#JsonExpr-neg)
+ [Binary operators: `==`, `!=`, `in`, `<`, `<=`, `>`, `>=`, `&&`, `||`, `+`, `-`, `*`, `contains`, `containsAll`, `containsAny`](#JsonExpr-binary)
+ [`.`, `has`](#JsonExpr-has)
+ [`like`](#JsonExpr-like)
+ [`if-then-else`](#JsonExpr-if-then-else)
+ [`Set`](#JsonExpr-Set)
+ [`Record`](#JsonExpr-Record)
+ [`Any other key`](#JsonExpr-any-other-key)

### `Value` {#JsonExpr-Value}

The value of this key is a Cedar value in the same syntax as expected for entity attribute values in Cedar’s entity format. This can include entity reference literals, set literals, and record literals.

**Example with numeric literals**

Cedar policy line:

```cedar
when { 1 == 2 };
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
            "==": {
                "left": {
                    "Value": 1
                },
                "right": {
                    "Value": 2
                }
            }
        }
    }
]
```

**Example with entity literals**

Cedar policy line

```cedar
when { User::"alice" == Namespace::Type::"SomePrincipal" };
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
            "==": {
                "left": {
                    "Value": {
                        "__entity": {
                            "type": "User",
                            "id": "alice"
                        }
                    }
                },
                "right": {
                    "Value": {
                        "__entity": {
                            "type": "Namespace::Type",
                            "id": "SomePrincipal"
                        }
                    }
                }
            }
        }
    }
]
```

**Example with set literals**

Cedar policy line:

```cedar
when { [1, 2, "something"] == [4, 5, "otherthing"] };
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
            "==": {
                "left": {
                    "Set": [
                        { "Value": 1 },
                        { "Value": 2 },
                        { "Value": "something" },
                    ]
                },
                "right": {
                    "Set": [
                        { "Value": 4 },
                        { "Value": 5 },
                        { "Value": "otherthing" },
                    ]
                }
            }
        }
    }
]
```

**Example with record literals**

Cedar policy line:

```cedar
when { {something: "spam", otherthing: false} == {} };
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
            "==": {
                "left": {
                    "Record": {
                        "something": { "Value": "spam" },
                        "otherthing": { "Value": false },
                    }
                },
                "right": {
                    "Record": {}
                }
            }
        }
    }
]
```

### `Var` {#JsonExpr-Var}

The value of this key is one of the strings `principal`, `action`, `resource`, or `context`.

**Example**

Cedar policy line:

```cedar
when { principal == action && resource == context };
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
            "&&": {
                "left": {
                    "==": {
                        "left": {
                            "Var": "principal"
                        },
                        "right": {
                            "Var": "action"
                        }
                    }
                },
                "right": {
                    "==": {
                        "left": {
                            "Var": "resource"
                        },
                        "right": {
                            "Var": "context"
                        }
                    }
                }
            }
        }
    }
]
```

### `Slot` {#JsonExpr-Slot}

The value of this key is one of the strings `?principal` or `?resource`. Currently, policies containing this are not valid Cedar

### `Unknown` {#JsonExpr-Unknown}

The value of this key is an object with a single key name, whose value is the name of the unknown. This is used for partial-evaluation.  In particular, these values may appear in the JSON rendering of residuals.

### `!` or `neg` operators {#JsonExpr-neg}

The value of this key is an object with a single key argument, whose value is itself an [JsonExpr object](#JsonExpr-objects).

**Example using `.` and `!`**

Example Cedar policy line:

```cedar
when { !context.something };
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
        "!": {
            "arg": {
                ".": {
                    "left": {
                        "Var": "context"
                    },
                    "attr": "something"
                }
            }
        }
    }
]
```

### Binary operators: `==`, `!=`, `in`, `<`, `<=`, `>`, `>=`, `&&`, `||`, `+`, `-`, `*`, `contains`, `containsAll`, `containsAny` {#JsonExpr-binary}

The value for any of these keys is an object with keys `left` and `right`, which are each themselves an [JsonExpr object](#JsonExpr-objects).

**Example for `contains`**

Cedar policy line

```cedar
when { principal.owners.contains("something") };
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
            "contains": {
                "left": {
                    ".": {
                        "left": {
                            "Var": "principal"
                        },
                        "attr": "owners"
                    }
                },
                "right": {
                    "Value": "something"
                }
            }
        }
    }
]
```

### `.`, `has` {#JsonExpr-has}

The value of one of these keys is an object with keys `left` and `attr`.  The left key is itself an [JsonExpr object](#JsonExpr-objects), while the `attr` key is a string.

**Example for `.`**

Cedar policy line

```cedar
context.something
```

JSON representation

```json
".": {
    "left": {
        "Var": "context"
    },
    "attr": "something"
}
```

### `is` {#JsonExpr-is}

The value of this key is an object with the keys `left` and `entity_type`.
The `left` key is itself an [JsonExpr object](#JsonExpr-objects), while the `entity_type` key is a string.
The value may optionally have an `in` key which is also a JsonExpr object.

**Example for `is`**

Cedar policy line

```cedar
principal is User in Group::"friends"
```

JSON representation

```json
"is": {
    "left": { "Var": "principal" },
    "entity_type": "User",
    "in": {"entity": { "type": "Folder", "id": "Public" }}
}
```

### `like` {#JsonExpr-like}

The value of this key is an object with keys `left` and `pattern`.  The left key is itself an [JsonExpr object](#JsonExpr-objects), while the `pattern` key is any string.

### `if-then-else` {#JsonExpr-if-then-else}

The value of this key is an object with keys `if`, `then`, and `else`, each of which are themselves an [JsonExpr object](#JsonExpr-objects).

**Example for if-then-else**

Cedar policy line

```cedar
when {
    if context.something
    then principal has "-78/%$!"
    else resource.email like "*@amazon.com"
};
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
            "if-then-else": {
                "if": {
                    ".": {
                        "left": {
                            "Var": "context"
                        },
                        "attr": "something"
                    }
                },
                "then": {
                    "has": {
                        "left": {
                            "Var": "principal"
                        },
                        "attr": "-78/%$!"
                    }
                },
                "else": {
                    "like": {
                        "left": {
                            ".": {
                                "left": {
                                    "Var": "resource"
                                },
                                "attr": "email"
                            }
                        },
                        "pattern": "*@amazon.com"
                    }
                }
            }
        }
    }
]    
```

### `Set` {#JsonExpr-Set}

The value of this key is a JSON array of values, each of which is itself an [JsonExpr object](#JsonExpr-objects).

**Example**

Cedar policy element

```cedar
[1, 2, "something"]
```

JSON representation

```json
{
    "Set": [
        { "Value": 1 },
        { "Value": 2 },
        { "Value": "something" },
    ]
}
```

### `Record` {#JsonExpr-Record}

The value of this key is a JSON object whose keys are arbitrary strings and values are themselves [JsonExpr objects](#JsonExpr-objects).

**Example for record**

Cedar policy element
`{something: "spam", somethingelse: false}`

JSON representation

```json
{
    "Record": {
        "foo": { "Value": "spam" },
        "somethingelse": { "Value": false },
    }
}    
```

### Any other key {#JsonExpr-any-other-key}

This key is treated as the name of an extension function or method.  The value must be a JSON array of values, each of which is itself an [JsonExpr object](#JsonExpr-objects).  Note that for method calls, the method receiver is the first argument.  For example, for `a.isInRange(b)`, the first argument is for `a` and the second argument is for `b`.

**Example for `decimal` function**

Cedar policy line

```cedar
decimal("10.0")
```

JSON representation

```json
{
    "decimal": [
        {
            "Value": "10.0"
        }
    ]
}
```

**Example for `ip` function and `isInRange` method**

Cedar policy line

```cedar
when {
    context.source_ip.isInRange(ip("222.222.222.0/24"))
};
```

JSON representation

```json
"conditions": [
    {
        "kind": "when",
        "body": {
            "isInRange": [
                {
                    ".": {
                        "left": {
                            "Var": "context"
                        },
                        "attr": "source_ip"
                    }
                },
                {
                    "ip": [
                        {
                            "Value": "222.222.222.0/24"
                        }
                    ]
                }
            ]
        }
    }
]
```

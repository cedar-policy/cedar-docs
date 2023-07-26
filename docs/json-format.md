---
layout: default
title: Programmatic policy creation using JSON
nav_order: 10
has_children: false
---

# Programmatic policy creation using JSON<a name="json-format"></a>
{: .no_toc }

You can use the Cedar `Policy::to_json()` method to convert the specified policy into a [JSON](https://json.org) document. 

You can also use the `Policy::from_json()` method to convert a JSON document into a new Cedar policy. This gives you another option for programmatically constructing or parsing your policies. 

The JSON document format you receive or submit using either of these methods is described in this topic.

***Example***

A "standard" Cedar policy looks like the following:

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
 
{: .note }
>The JSON representation of a Cedar policy does not preserve comments, whitespace, or newline characters. 

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

The `op` key is required. The `op` object must have one of the following string values:

* `All` 

    If present, then the original policy contains only the key word `principal` with no constraints. In this case, the `principal` object doesn't require any additional objects.

    **Example**

    Cedar policy line:
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

    **Example** 

    Cedar policy line:

    `"principal" == User::"12UA45"`

    JSON representation: 

    ```
    "principal": {
        "op": "==",
        "entity": { "type": "User", "id": "12UA45" }
    }
     ```
  
  * [`slot`](#slot)

    **Example** 

    Cedar policy line:

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

    **Example**

    Cedar policy line:

    `"principal" in Group::"Admins"`

    JSON representation:
    
    ```
    "principal": {
        "op": "in",
        "entity": { "type": "Group", "id": "Admins" }
    }
    ```

  * [`slot`](#slot)

    **Example**

    Cedar policy line:
    
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

The `op` key is required. 

The `op` object must have one of the following string values:

* `All` 

    If present, then the original policy contains only the key word `action` with no constraints. In this case, the `action` object doesn't require any additional objects.
    
    **Example**
    
    Cedar policy line:

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

    **Example**
    
    Cedar policy line:
    
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

    **Example**
    
    Cedar policy line:
    
    `"action" in Action::"readOnly"`
    
    JSON representation:
    
    ```
    "principal": {
        "op": "in",
        "entity": { "type": "Action", "id": "readOnly" }
    }
    ```

  * [`entities`](#entities)
    
    **Example**
     
    Cedar policy line:
    
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

The value of this object must include an object with the key `op`, and depending on the value of `op`, an object with the key `entity` or `slot`.

## `op`

The `op` key is required. 

The `op` object must have one of the following string values:

* `All`

    If present, then the original policy contains only the key word `resource` with no constraints. In this case, the `resource` object doesn't require any additional objects.

    **Example**

    Cedar policy line:
    
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

    **Example**

    Cedar policy line:
    
    `"resource" == file::"vacationphoto.jpg"`

    JSON representation: 
    
    ```
    "resource": {
        "op": "==",
        "entity": { "type": "file", "id": "vacationphoto.jpg" }
    }
    ```
  
  * [`slot`](#slot)

    **Example**
    
    Cedar policy line:
    
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

    **Example** 

    Cedar policy line:
    
    `"resource" in folder::"Public"`
    
    JSON representation:
    
    ```
    "resource": {
        "op": "in",
        "entity": { "type": "folder", "id": "Public" }
    }
    ```

  * [`slot`](#slot)
  
    **Example**
    
    Cedar policy line:
    
    `"resource" in "?resource"`
    
    JSON representation
    
    ```
    "resource": {
        "op": "in",
        "slot": { "?resource" }
    }
    ```

# conditions

The `conditions` object is required.

The value of this object is a JSON array of objects.  Each object in the array must have exactly two keys: `kind` and `body`.  

The `kind` key must be either the string `when` or the string `unless`.

The `body` key must be an [JsonExpr object](#JsonExpr-objects).

**Example**

Cedar policy lines

`when { ... }`

JSON representation

```
"conditions": [
    {
        "kind": "when",
        "body": {
            ...
        }
    }
]
```
# `annotations`

Annotations, if present, must be a JSON object.  The keys and values, which must all be strings, correspond to the Cedar annotation keys and values on the policy.

# `entity`

This object has a value that specifies the Cedar `type` and unique `id` of a single entity.

```
"entity": { "type": "User", "id": "12UA45" }
```

# `entities`

This object is a JSON array or list of objects. Each entry in the list is a  each with a value that specifies the `type` and `id` of the entity.

```
"entities": [
    { "type": "User", "id": "12UA45" },
    { "type": "Group", "id": "67VB89" }
]
```

# `slot`
This key is required only if the policy being rendered is a template that uses a placeholder and the `principal` or `resource` object uses the `==` or `in` operator. 

```
"slot": "?principal"
"slot": "?resource"
```

## JsonExpr objects<a name="JsonExpr-objects">
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

### `Value`<a name="JsonExpr-Value">

The value of this key is a Cedar value in the same syntax as expected for entity attribute values in Cedar’s entity format. This can include entity reference literals, set literals, and record literals.

**Example with numeric literals**
    
Cedar policy line:

`when { 1 == 2 };`
    
JSON representation

```
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

`when { User::"alice" == Namespace::Type::"SomePrincipal" };`
    
JSON representation

```
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

`when { [1, 2, "something"] == [4, 5, "otherthing"] };`

JSON representation

```
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

`when { {something: "spam", otherthing: false} == {} };`

JSON representation

```
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

### `Var`<a name="JsonExpr-Var">

The value of this key is one of the strings `principal`, `action`, `resource`, or `context`.

**Example**
    
Cedar policy line:

`when { principal == action && resource == context };`

JSON representation

```
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

### `Slot`<a name="JsonExpr-Slot">

The value of this key is one of the strings `?principal` or `?resource`. Currently, policies containing this are not valid Cedar

### `Unknown`<a name="JsonExpr-Unknown">

The value of this key is an object with a single key name, whose value is the name of the unknown. This is used for partial-evaluation.  In particular, these values may appear in the JSON rendering of residuals.

### `!` or `neg` operators<a name="JsonExpr-neg">

The value of this key is an object with a single key argument, whose value is itself an [JsonExpr object](#JsonExpr-objects).

**Example using `.` and `!`**

Example Cedar policy line:

`when { !context.something };`

JSON representation

```
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

### Binary operators: `==`, `!=`, `in`, `<`, `<=`, `>`, `>=`, `&&`, `||`, `+`, `-`, `*`, `contains`, `containsAll`, `containsAny`<a name="JsonExpr-binary">

The value for any of these keys is an object with keys `left` and `right`, which are each themselves an [JsonExpr object](#JsonExpr-objects).

**Example for `contains`**

Cedar policy line

`when { principal.owners.contains("something") };`

JSON representation

```
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

### `.`, `has`<a name="JsonExpr-has">

The value of one of these keys is an object with keys `left` and `attr`.  The left key is itself an [JsonExpr object](#JsonExpr-objects), while the `attr` key is a string.

**Example for `.`**

Cedar policy line

`context.something`

JSON representation

```
".": {
    "left": {
        "Var": "context"
    },
    "attr": "something"
}
```

### `like`<a name="JsonExpr-like">

The value of this key is an object with keys `left` and `pattern`.  The left key is itself an [JsonExpr object](#JsonExpr-objects), while the `pattern` key is any string.

### `if-then-else`<a name="JsonExpr-if-then-else">

The value of this key is an object with keys `if`, `then`, and `else`, each of which are themselves an [JsonExpr object](#JsonExpr-objects).

**Example for if-then-else**

Cedar policy line

```
when {
    if context.something
    then principal has "-78/%$!"
    else resource.email like "*@amazon.com"
};
```    

JSON representation

```
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

### `Set`<a name="JsonExpr-Set">

The value of this key is a JSON array of values, each of which is itself an [JsonExpr object](#JsonExpr-objects).

**Example**

Cedar policy element

`[1, 2, "something"]`

JSON representation

```
{
    "Set": [
        { "Value": 1 },
        { "Value": 2 },
        { "Value": "something" },
    ]
}    
```

### `Record`<a name="JsonExpr-Record">

The value of this key is a JSON object whose keys are arbitrary strings and values are themselves [JsonExpr objects](#JsonExpr-objects).

**Example for record**

Cedar policy element
`{something: "spam", somethingelse: false}`

JSON representation
```
{
    "Record": {
        "foo": { "Value": "spam" },
        "somethingelse": { "Value": false },
    }
}        
```

### Any other key<a name="JsonExpr-any-other-key">

This key is treated as the name of an extension function or method.  The value must be a JSON array of values, each of which is itself an [JsonExpr object](#JsonExpr-objects).  Note that for method calls, the method receiver is the first argument.  For example, for `a.isInRange(b)`, the first argument is for `a` and the second argument is for `b`.

**Example for `decimal` function**

Cedar policy line

`decimal("10.0")`

JSON representation

```
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

```
when {
    context.source_ip.isInRange(ip("222.222.222.0/24"))
};    
```

JSON representation

```
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

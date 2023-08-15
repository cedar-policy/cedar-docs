---
layout: default
title: Operators
parent: Policy syntax
nav_order: 4
---

# Operators and functions to use in Cedar<a name="syntax-operators"></a>
{: .no_toc }

This topic describes the built-in operators and functions that you can use to build your expressions using the Cedar policy language.

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Overview of operators<a name="operators-overview"></a>

The operators use the following syntax structures:
+ **Unary operators** &ndash; A unary operator takes one operand. Place the operand after the operator.

  ```
  <operator> operand
  
  // Uses the logical NOT operator and evaluates to the 
  // inverse of the value of the Boolean operand
  ! a
  ```
+ **Binary operators** &ndash; A binary operator takes two operands. Place one operand before the operator and one after. Some binary operators are [commutative](https://wikipedia.org/wiki/Commutative_property). See the description of each operator to understand where operand order matters. 

  ```
  firstOperand <operator> secondOperand
  
  // Evaluates to true if both operands have the same type and value
  a == b
  
  // Evaluates to true if the first operand is within the 
  // hierarchy of the second operand
  c in d
  ```

Functions use the following syntax:
+ Functions can support zero or more operands. Append the function name to the end of the entity name, separating them with a `.` \(period\) character. Place any operands in parentheses after the function name, separating them with commas.

  ```
  entity.function(firstOperand, secondOperand, …)
  
  // Evaluates to true if the any of the set member 
  // elements b, c, or d is an element of set a
  a.containsAny([b, c, d])
  ```


## String operators and functions<a name="operators-string"></a>

Use these operators and functions to compare strings or convert them to other types.

### `like` \(string matching with wildcard\)<a name="operators-string-like"></a>

**Usage:** `<string> like <string with wildcards>`

Binary operator that evaluates to `true` if the string in the left operand matches the pattern string in the right operand. The pattern string can include one or more asterisks (`*`) as wildcard characters that match 0 or more of any character.

To match a literal asterisk character, use the escaped `\*` sequence in the pattern string.

Consider a query with the following context:
```
"context": {
    "location": "s3://bucketA/redTeam/some/thing/*"
}
```
In that scenario, the following expression returns `true`.
```
context.location like "s 3:*"         //true
```

#### More Examples:
{: .no_toc }

```
"eggs" like "ham*"                                             //false
"eggs" like "*ham"                                             //false
"eggs" like "*ham*"                                            //false
"ham and eggs" like "ham*"                                     //true
"ham and eggs" like "*ham"                                     //false
"ham and eggs" like "*ham*"                                    //true
"ham and eggs" like "*h*a*m*"                                  //true
"eggs and ham" like "ham*"                                     //false
"eggs and ham" like "*ham"                                     //true
"eggs, ham, and spinach" like "ham*"                           //false
"eggs, ham, and spinach" like "*ham"                           //false
"eggs, ham, and spinach" like "*ham*"                          //true
"Gotham" like "ham*"                                           //false
"Gotham" like "*ham"                                           //true
"ham" like "ham"                                               //true
"ham" like "ham*"                                              //true
"ham" like "*ham"                                              //true
"ham" like "*h*a*m*"                                           //true
"ham and ham" like "ham*"                                      //true
"ham and ham" like "*ham"                                      //true
"ham" like "*ham and eggs*"                                    //false
"\\afterslash" like "\\*"                                      //true
"string\\with\\backslashes" like "string\\with\\backslashes"   //true
"string\\with\\backslashes" like "string*with*backslashes"     //true
"string*with*stars" like "string\*with\*stars"                 //true
```

### `decimal()` \(parse string and convert to decimal\)<a name="function-decimal"></a>

**Usage:** `decimal(<string>)`

Function that parses the string and tries to convert it to type [decimal](syntax-datatypes.md#datatype-decimal). If the string doesn't represent a valid decimal value, it generates an error.

To be interpreted successfully as a decimal value, the string must contain a decimal separator \(`.`\) and at least one digit before and at least one digit after the separator. There can be no more than 4 digits after the separator. The value must be within the valid range of the decimal type, from `-922337203685477.5808` to `922337203685477.5807`.

#### Examples:
{: .no_toc }

```
decimal("1.0")
decimal("-1.0")
decimal("123.456")
decimal("0.1234")
decimal("-0.0123")
decimal("55.1")
decimal("00.000")
decimal("1234")                  //error
decimal("1.0.")                  //error
decimal("1.")                    //error
decimal(".1")                    //error
decimal("1.a")                   //error
decimal("-.")                    //error
decimal("1000000000000000.0")    //overflow
decimal("922337203685477.5808")  //overflow
decimal("0.12345")               //error
decimal("0.00000")               //error
```

### `ip()` \(parse string and convert to ipaddr\)<a name="function-ip"></a>

**Usage:** `ip(<string>)`

Function that parses the string and attempts to convert it to type `ipaddr`. If the string doesn't represent a valid IP address or range, then it generates an error.

```
ip("127.0.0.1")
ip("::1")
ip("127.0.0.1/24")
ip("ffee::/64")
ip("ff00::2")
ip("::2")

ip("380.0.0.1")                     //error – invalid IPv4 address
ip("ab.ab.ab.ab")                   //error – invalid IPv4 address
ip("127.0.0.1/8/24")                //error – invalid CIDR notation
ip("fee::/64::1")                   //error – invalid IPv6 address
ip("fzz::1")                        //error – invalid character in address
ip([127,0,0,1])                     //error – invalid type 
"127.0.0.1".ip()                    //error – invalid call style

ip("127.0.0.1") == ip("127.0.0.1")            //true
ip("192.168.0.1") == ip("8.8.8.8")            //false
ip("192.168.0.1/24") == ip("8.8.8.8/8")       //false
ip("192.168.0.1/24") == ip("192.168.0.8/24")  //true
ip("127.0.0.1") == ip("::1")                  //false – different IP versions
ip("127.0.0.1") == "127.0.0.1"                //false – different types
ip("::1") == 1                                //false – different types
ip("127.0.0.1") == ip("192.168.0.1/24")       //false - address compared to range
ip("127.0.0.1") < ip("10.0.0.10")             //error – invalid data types for < operator
```

## Comparison operators and functions<a name="operators-comparison"></a>

Use these operators to compare two values as an expression. An expression that uses one of these operators evaluates to a Boolean `true` or `false`. You can then combine multiple expressions using the logical operators.

### `==` \(equality\)<a name="operator-equality"></a>

**Usage:** `<any type> == <any type>`

Binary operator that compares two operands of any type and evaluates to `true` only if they are exactly the same type and the same value. If the operands are of different types, the result is always `false`. 

#### Examples:
{: .no_toc }

```
1 == 1                          //true
5 == "5"                        //false
"something" == "something"      //true
"Something" == "something"      //false
[1, -33, 707] == [1, -33]       //false
[1, 2, 40] == [1, 2, 40]        //true
[1, 2, 40] == [1, 40, 2]        //true
[1, -2, 40] == [1, 40]          //false
[1, 1, 1, 2, 40] == [40, 1, 2]  //true
[1, 1, 2, 1, 40, 2, 1, 2, 40, 1]== [1, 40, 1, 2]   //true
true == true                    //true
context.device_properties == {"os ":"Windows ", "version":11} 
                                //true if context.device_properties represents a Windows 11 computer
A == A                          //true even if A is an entity that doesn't exist
User::"alice" == User::"bob"    //false -- two different objects of same type
User::"alice" == Admin::"alice" //false -- objects of two different types
"alice" == User::"alice         //false -- string versus entity
```

### `!=` \(inequality\)<a name="operator-inequality"></a>

**Usage:** `<any type> != <any type>`

Binary operator that compares two operands of any type and evaluates to `true` if the operands have different values or are of different types. You can use `!=` ***only*** in `when` and `unless` clauses.

#### Example:
{: .no_toc }

```
forbid(principal, action, resource)
when{
    resource.tag != "public"
};
```

### `<` \(long integer 'less than'\)<a name="operator-lessthan"></a>

**Usage:** `<long> < <long>`

Binary operator that compares two long integer operands and evaluates to `true` if the left operand is numerically less than the right operand.

#### Examples:
{: .no_toc }

```
3 < 303               //true
principal.age < 22    //true (assume principal.age is 21)
3 < "3"               //type error
false < true          //type error
"some" < "thing"      //type error
"" < "zzz"            //type error
"" < ""               //type error
[1, 2] < [47, 0]      //type error
```

### `.lessThan()` \(decimal 'less than'\)<a name="function-lessThan"></a>

**Usage:** `<decimal>.lessThan(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically less than the right operand.

#### Examples:
{: .no_toc }

```
decimal("1.23").lessThan(decimal("1.24"))     //true
decimal("1.23").lessThan(decimal("1.23"))     //false
decimal("123.45").lessThan(decimal("1.23"))   //false
decimal("-1.23").lessThan(decimal("1.23"))    //true
decimal("-1.23").lessThan(decimal("-1.24"))   //false
```

### `<=` \(long integer 'less than or equal'\)<a name="operator-lessthanorequal"></a>

**Usage:** `<long> <= <long>`

Binary operator that compares two long integer operands and evaluates to `true` if the left operand is numerically less than or equal to the right operand.

#### Examples:
{: .no_toc }

```
3 <= 303               // true
principal.age <= 21    // true (assume principal.age is 21)
3 <= "3"               // type error
false <= true          // type error
"some" <= "thing"      // type error
"" <= "zzz"            // type error
"" <= ""               // type error
[1, 2] <= [47, 0]      // type error
```

### `.lessThanOrEqual()` \(decimal 'less than or equal'\)<a name="function-lessThanOrEqual"></a>

**Usage:** `<decimal>.lessThanOrEqual(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically less than or equal to the right operand.

#### Examples:
{: .no_toc }

```
decimal("1.23").lessThanOrEqual(decimal("1.24"))    // true
decimal("1.23").lessThanOrEqual(decimal("1.23"))    // true
decimal("123.45").lessThanOrEqual(decimal("1.23"))  // false
decimal("-1.23").lessThanOrEqual(decimal("1.23"))   // true
decimal("-1.23").lessThanOrEqual(decimal("-1.24"))  // false
```

### `>` \(long integer 'greater than'\)<a name="operator-greaterthan"></a>

**Usage:** `<long> > <long>`

Binary operator that compares two long integer operands and evaluates to `true` if the left operand is numerically greater than the right operand.

#### Examples:
{: .no_toc }

```
3 > 303                // false
principal.age > 22     // false (assume principal.age is 21)
3 <= "3"               // type error
false <= true          // type error
"some" <= "thing"      // type error
"" <= "zzz"            // type error
"" <= ""               // type error
[1, 2] <= [47, 0]      // type error
```
### `.greaterThan()` \(decimal 'greater than or equal'\)<a name="function-greaterThan"></a>

**Usage:** `<decimal>.greaterThan(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically greater than the right operand.

#### Examples:
{: .no_toc }
```
decimal("1.23").greaterThan(decimal("1.24"))    // false
decimal("1.23").greaterThan(decimal("1.23"))    // false
decimal("123.45").greaterThan(decimal("1.23"))  // true
decimal("-1.23").greaterThan(decimal("1.23"))   // false
decimal("-1.23").greaterThan(decimal("-1.24"))  // true
```

### `>=` \(Long integer 'greater than or equals'\)<a name="operator-greaterthanorequal"></a>

**Usage:** `<long> >= <long>`

Binary operator that compares two long integer operands and evaluates to `true` if the left operand is numerically greater than or equal to the right operand.

#### Examples:
{: .no_toc }

```
3 >= 303               //false
principal.age >= 21    //true (assume principal.age is 21)
3 >= "3"               //type error
false >= true          //type error
"some" >= "thing"      //type error
"" >= "zzz"            //type error
"" >= ""               //type error
[1, 2] >= [47, 0]      //type error
```
### `.greaterThanOrEqual()` \(decimal 'greater than or equal'\)<a name="function-greaterThanOrEqual"></a>

**Usage:** `<decimal>.greaterThanOrEqual(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically greater than or equal to the right operand.

#### Examples:
{: .no_toc }

```
decimal("1.23").greaterThanOrEqual(decimal("1.24"))    //false
decimal("1.23").greaterThanOrEqual(decimal("1.23"))    //true
decimal("123.45").greaterThanOrEqual(decimal("1.23"))  //true
decimal("-1.23").greaterThanOrEqual(decimal("1.23"))   //false
decimal("-1.23").greaterThanOrEqual(decimal("-1.24"))  //true
```
## Logical operators<a name="operators-logical"></a>

Use these operators to logically combine Boolean values or expressions.

### `&&` \(AND\)<a name="operator-and"></a>

**Usage:** `<Boolean> && <Boolean>`

Binary operator that evaluates to `true` only if both arguments are `true`. 

In the following policy, the `when` condition is `true` if both `principal.numberOfLaptops < 5` and p`rincipal.jobLevel > 6` are `true`.
```
permit(principal, action == Action::"remoteAcces s ", res ource)
when {
    principal.numberO fLaptops < 5 &&
    principal.jobLevel > 6
}
```
The `&&` operator uses [short circuit evaluation](https://wikipedia.org/wiki/Short-circuit_evaluation). If the first argument is `false`, then the expression immediately evaluates to `false` and the second argument isn't evaluated. This approach is useful when the second argument might result in an error if evaluated. You can use the first argument to test that the second argument is a valid expression. 

The following policy allows only if the principal has the attribute `level` and the `level > 5`.
```
permit(principal, action == Action:"read", res ource)
when {
    principal has level &&
    principal.level > 5
};
````
The second comparison in this expression is valid only if the `numberOfLaptops` property for the `principal` entity has a value. If it doesn't, the less than operator generates an error. The first expression uses the [**has**](#operator-has) operator to ensure that the `principal` entity does have such a property with a value. If that evaluates to `false`, then the second expression isn't evaluated.

#### More Examples:
{: .no_toc }

```
false && 3          //false
(false && 3) == 3   //false, short-circuiting
true && 3           //type error
3 && false          // type error
```

### `||` \(OR\)<a name="operator-or"></a>

**Usage:** `<Boolean> || <Boolean>`

Binary operator that evaluates to `true` if either one or both arguments are `true`.

This operator uses [short circuit evaluation](https://wikipedia.org/wiki/Short-circuit_evaluation). If the first argument is `true`, then the expression immediately evaluates to `true` and the second argument isn't evaluated. This approach is useful when the second argument might result in an error if evaluated. The first argument should be a test that can determine if the second argument is a valid expression. For example, consider the following expression. It evaluates to `true` if the principal can't be confirmed to at least 21 years old and `principal` is either missing the `age` property or that property is set to a value less than 21.

```
!(principal has age) || principal.age < 21 
```

The second comparison in this expression is valid only if the `age` property for the `principal` entity is present. If it is missing, the less than operator generates an error. The first expression uses the [**has**](#operator-has) operator, inverted by the `!` **[NOT](#operator-not)** operator, to flag that the `principal` entity is missing the `age` property. If that evaluates to `true`, there is no test of the second expression.

The following policy allows if either `resource.owner == principal` or `resource.tag == "public"` is true.
```
permit(principal, action == Action:"read", resource)
when {
    resource.owner == principal ||
    resource.tag == "public"
}
```

#### More Examples:
{: .no_toc }

```
true || 3                  //true, short-circuiting
false || 3                 //type error
3 || true                  //type error
(true || 3) == 3           //false, short-circuiting
(true || 3 || true) == 3   //false, short-circuiting
```

### `!` \(NOT\)<a name="operator-not"></a>

**Usage:** ` ! <Boolean>`

Unary operator with only one argument. It inverts the value of the Boolean operand from `true` to `false`, or from `false` to `true`. 

#### Example:
{: .no_toc }

The following policy forbids if the principal does not belong to Group::"family".
```
forbid(principal, action, resource)
when {
    !(principal in Group::"family")
};
```
You can rewrite the above policy using an `unless` clause as:
```
forbid(principal, action, resource)
unless {
  principal in Group::"family"
};
```
#### More Examples:
{: .no_toc }

```
! true                                // false
! false                               // true
! 8                                   // type error
if !true then "hello" else "goodbye"  // "goodbye"
```

## Arithmetic operators<a name="operators-math"></a>

Use these operators to perform arithmetic operations on long integer values. 

**Notes**  
The arithmetic operators support ***only*** values of type `Long`. They don't support values of type `Decimal`.
There is no operator for arithmetic division.

{: .warning }
>If you exceed the range available for the Long data type by using any of the arithmetic operators, it results in an overflow error. A policy that results in an error is ignored, meaning that a Permit policy might unexpectedly fail to allow access, or a Forbid policy might unexpectedly fail to block access.

### `+` \(Numeric addition\)<a name="operator-add"></a>

**Usage:** `<long> + <long>`

Binary operator that adds the two long integer values and returns a long integer sum.

#### Example:
{: .no_toc }

The following policy returns `allow` if the context `budget` minus the context `downloaded` is greater than 100.
```
permit(principal, action, resource)
when {
    context.budget - context.downloaded > 100
};
```
#### Other examples:
{: .no_toc }

```
11 + 0                              // 11
-1 + 1                              // 0
9,223,372,036,854,775,807 + 1       //overflow
-9,223,372,036,854,775,808 - 1 + 3  //overflow
7 + "3"                             //type error
"lamp" + "la"                       //type error - no support for string concatenation
```

### `-` \(Numeric subtraction or negation\)<a name="operator-subtract"></a>

**Usage:** `<long> - <long>`

As a binary operator with two operands, it subtracts the second long integer value from the first and returns a long integer difference.

#### Examples:
{: .no_toc }

```
44 - 31                             // 13
5 - (-3)                            // 8
-9,223,372,036,854,775,808 - 1 + 3  // overflow
```

**Usage:** `- <long>`

As a unary operator with one operand, it returns the negative of the value.

#### Examples:
{: .no_toc }

```
-3
```
### `*` \(Numeric multiplication\)<a name="operator-multiply"></a>

**Usage:** `<long> * <long>`

Binary operator that multiplies two long integer values and returns a long integer product. One of the values ***must*** be an integer literal, the other value can be an integer literal or an expression that evaluates to an integer value. 

{: .note }
>There is no operator for arithmetic division.

#### Examples:
{: .no_toc }

```
10 * 20                          // 200
resource.value * 10             // valid
2 * context.budget > 100         // valid
context.budget * context.limit   // not valid. One operand must be a constant
9223372036854775807 * 2          // overflow
5 * (-3)                         // -15
5 * 0                            // 0
"5" * 0                          // type error
```

## Hierarchy and set membership operators and functions<a name="functions-set"></a>

Use these functions to test if entities are members of a hierarchy or a set.

### `in` \(Hierarchy membership\)<a name="operator-in"></a>

**Usage:** `<entity> in <entity>`

Boolean operator that evaluates to `true` if the entity in the left operand is a descendant in the hierarchy under the entity in the right operand.

The `in` operator is transitive. If `A` is in `B`, and `B` is in `C`, then `A` is also in `C`. This approach allows you to model the concept of a multi-tier hierarchy, for example nesting folders in other folders.

The `in` operator is reflexive; If the right operand is a single entity, then the expression evaluates to `true` if the right entity is the same as the left entity. In other words, an entity is *always* in its own hierarchy. `A` is always in `A`.

**Usage:** `<entity> in set(<entity>, <entity>, ...)`

#### Examples:
{: .no_toc }

For example, assume that the `principal` in a request is `User::"12345"`

```
principal in User::"12345"     // true - testing if a value is in itself always returns true
principal in [User::"12345"]   // true - testing if a value is in a set consisting of only itself always returns true
principal in Group::"67890"    // true if User::"12345" belongs to Group::"67890"
principal in [Group::"67890"]  // true if User::"12345" belongs to Group::"67890"
```

#### More examples:
{: .no_toc }

Consider the following set of entities:

![Example entities](./images/entities.png)

```
User::"jane" in User::"jane"           // true - `in` is reflexive
User::"bob" in Group::"jane_friends"   // true - Group::"jane_friends" is an ancestor of User::"bob".
User::"john" in Group::"jane_friends"  // false - User::"john"'s only ancestor is Group"jane_coworkers".
```

If the right operand is a set of entities, then the expression is evaluated for each member in the set. For example, consider the following expression.

```
A in [ B, C, D ]
```

That expression is evaluated as component expressions joined by the [logical OR operator](#operator-or), as shown in the following example.

```
A in B || A in C || A in D 
```

If any one or more of the component expressions evaluates to `true`, then the overall expression evaluates to `true`.

```
User::"bob" in [Group::"jane_friends"] // true
User::"alice" in [ 
    Group::"jane_family", 
    Group::"jane_friends "
]                                      // true - User::"Alice" is a member of Group::"jane_friends"
User::"alice" in [
    User::"bob", 
    User::"alice"
]                                      // true - User::"alice" in User::"alice"
User::"john" in [
    Group::"jane_family",
    Group::"jane_friends"
]                                      // false - User::"john" isn't a member of any entities in the set
```
The right operand of in can be any expression that returns a set of entity references, not just a set literal. For example, suppose the query context contains the following:
```
{
    "groups ": [Group::"jane_family", Group::"jane_friends "]
}
```
Then the following two expressions in a policy statement are equivalent:
```
User::"alice" in context.groups 
User::"alice" in [Group::"jane_family", Group::"jane_friends"]
```
However, the following expression raises a type error because "Team" is a string, not an entity reference.
```
User::"alice" in [User::"alice", Group::"jane_friends", "Team"]   // type error
```
Because the in operator is reflexive, A in A returns true even if the entity A does not exist. The evaluator treats entity references that are not in the hierarchy as a valid entity. For example:
```
Stranger::"jimmy" in Stranger::"jimmy"        // true by reflexivity.
Stranger::"jimmy" in Group::"jane_friends"    // false - Stranger::"jimmy" does not refer to an existing entity
Stranger::"jimmy" in [
    Group::"jane_family",
    Stranger::"jimmy"
]                                             // true - Stranger::"jimmy" in Stranger::"jimmy" is true
```
#### More Examples:
{: .no_toc }

```
"some" in ["some", "thing"] //type error - these are strings, not entities. For strings, use `contains` for set membership.
"os" in {"os":"Windows "}   //type error - use `has` operator to check if a key exists
```

### `has` \(presence of attribute test\)<a name="operator-has"></a>

**Usage:** `<entity> has <attribute>`

Boolean operator that evaluates to `true` if the left operand has a value defined for the specified attribute. Use this operator to check that a value is present before accessing that value. If you attempt to access a value that isn't defined, then Cedar generates an error. 

The following example expression first tests whether the entity `A` has a defined attribute `B`. Because the [&&](#operator-and) operator uses shortcut logic, the second expression is evaluated and the attribute accessed *only* if the attribute is present.
```
A has B && A.B == 5
```
In the following example, assume that the request has the following context:
```
"context":{
    "role": ["admin", "us er"],
    "addr": { "s treet": "main", "city": "DC"}
    "owner info": { "name": "Alice", "age": 18 }
}
```
The following condition checks if the context has an attribute `role`. If the attribute exists, then it checks if it is a set containing the string `"admin"` as an element.
```
context has role && context.role.contains("admin")       //true
```
The attribute name `role` can be written as an identifier (as in the previious example) or as a string literal. The following expression is equivalent to the previous one:
```
context has "role" && context.role.contains("admin")     //true
```
You must check for presence of optional attributes that are nested multiple layers one at a time. For example, to check for the presence of `principal.custom.project`, you must first check if `principal` has a `custom` attribute. You can then check to see if that `custom` attribute has a `project` attribute.  To do this, you could use the following syntax.
```
principal has custom && principal.custom has project 
```
If the attribute name is not valid as an identifier, then the string literal syntax must be used for `has` and attribute values must be accessed with the `[]` operator instead of using dot syntax. For example, to check if `context` has an attribute called `owner info` (with an embedded space), then you could use the following syntax.
```
context has "owner info" && context["owner info"].name == "Alice"    //true
```
The following expression returns false because `context` doesn't have an attribute `tag`.
```
context has tag      //false
```
The following expression returns a type error because the left-hand side of the `has` operator must be an entity or a record. In this example, because `role` is a set, Cedar generates a type error.
```
context.role has admin     //type error
```
The following expression returns `false` because the `addr` sub-record does not have an attribute `country`. The second expression is not evaluated.
```
context.addr has country && context.addr.country == "US "    //false
```
However, consider the case where `context` does not have the `addr` sub-record at all:
```
"context": {
    "role": ["admin", "user"]
}
```
In that case, then the previous expression that checks for `context.addr has country` raises a missing-attribute error on `context.addr` before the `has` operator is even evaluated, and the entire policy is skipped. If the `addr` sub-record is optional, you can avoid this error by checking whether `addr` is present before accessing it with the `.` operator:
```
context has addr && context.addr has country && context.addr.country == "US"  // false, with no error
```

### `.contains()` \(single element set membership test\)<a name="function-contains"></a>

**Usage:** `<set>.contains(<entity>)`

Function that evaluates to `true` if the operand is a member of the receiver on the left side of the function. The receiver must be of type `set`.

#### Examples:
{: .no_toc }

```
[1,2,3].contains (1)                            // true
[1,"something",2].contains(1)                   // true
[1,"something",2].contains("Something")         // false - string comparision is case-sensitive
["some", "useful", "tags"].contains("useful")   // true
[].contains (100)                               // false
context.role.contains ("admin")                 // true if the set `role` contains the string "admin"
[User::"alice"].contains (principal)            // true if principal == User::"alice"
"ham and ham".contains ("ham")                  // type error - 'contains' is not allowed on strings
```

### `.containsAll()` \(all element set membership test\)<a name="function-containsAll"></a>

**Usage:** `<set>.containsAll(<set>)`

Function that evaluates to `true` if *every* member of the operand set is a member of the receiver set. Both the receiver and the operand must be of type `set`.

```
[1, -22, 34].containsAll([-22, 1])                           // true
[1, -22, 34].containsAll([-22])                              // true
[43, 34].containsAll([34, 43])                               // true
[1, -2, 34].containsall([1, -22])                            // false
[1, 34].containsAll [1, 101, 34]                             // false
[false, 3, [47, 0], "some"].containsAll([3, "some"])         // true
[false, 3, [47, 0], {"2": "ham"}].containsAll([3, {"2": "ham"}])  // true
[2, 43].containsAll([])                                      // true
[].containsAll([2, 43])                                      // false
[false, 3, [47, 0], "thing"].containsAll("thing")            // type error - operand a string
"ham and eggs".containsAll("ham")                            // type error - prefix and operand are strings
{"2": "ham", "3": "eggs "}.containsAll({"2": "ham"})         // type error - prefix and operand are records
```

### `.containsAny()` \(any element set membership test\)<a name="function-containsAny"></a>

**Usage:** `<set>.containsAny(<set>)`

Function that evaluates to `true` if *any one or more* members of the operand set is a member of the receiver set. Both the receiver and the operand must be of type `set`.

```
[1, -22, 34].containsAny([1, -22])                             // true
[1, -22].containsAny([1, -22, 34])                             // true
[-22].containsAny([1, -22, 34])                                // true
[1, 101].containsAny([1, -22, 34])                             // true
[1, 101].containsAny([-22, 34])                                // false
["alice","bob","charlie"].containsAny(["david","bob","juan"])  // true
[].containsAny(["bob"])                                        // false
["bob"].containsAny([])                                        // false
"ham".containsAny("ham and eggs")                              // type error - operand is a string
{"2": "ham"}.containsAny({"2": "ham", "3": "eggs "})           // type error - prefix and operands are records
```

## IP address functions<a name="functions-ipaddr"></a>

Use these functions to test characteristics of IP addresses and ranges.

### `.isIpv4()` \(IPv4 address valid test\)<a name="function-isIpv4"></a>

**Usage:** `<ipaddr>.isIpv4()`

Evaluates to `true` if the receiver is an IPv4 address. This function takes no operand.

```
ip("127.0.0.1").isIpV4()     //true
ip("::1").isIpV4()           //false
ip("127.0.0.1/24").isIpV4()  //true
```

### `.isIpv6()` \(IPv6 address valid test\)<a name="function-isIpv6.title"></a>

**Usage:** `<ipaddr>.isIpv6()`

Function that evaluates to `true` if the receiver is an IPv6 address. This function takes no operand.

```
ip("127.0.0.1/24").isIpV6()  //false
ip("ffee::/64").isIpV6()     //true
ip("::1").isIpV6()           //true
```

### `.isLoopback()` \(test for IP loopback address\)<a name="function-isLoopback.title"></a>

**Usage:** `<ipaddr>.isLoopback()`

Function that evaluates to `true` if the receiver is a valid loopback address for its IP version type. This function takes no operand.

```
ip("127.0.0.2").isLoopback()  //true
ip("::1").isLoopback()        //true
ip("::2").isLoopback()        //false
```

### `.isMulticast()` \(test for multicast address\)<a name="function-isMulticast.title"></a>

**Usage:** `<ipaddr>.isMulticast()`

Function that evaluates to `true` if the receiver is a multicast address for its IP version type. This function takes no operand.

```
ip("127.0.0.1").isMulticast()  //false
ip("ff00::2").isMulticast()    //true
```

### `.isInRange()` \(test for inclusion in IP address range\)<a name="function-isInRange.title"></a>

**Usage:** `<ipaddr>.isInRange(<ipaddr>)`

Function that evaluates to `true` if the receiver is an IP address or a range of addresses that fall completely within the range specified by the operand.

```
ip("192.168.0.1").isInRange(ip("192.168.0.1/24"))   //true
ip("192.168.0.1").isInRange(ip("192.168.0.1/28"))   //true
ip("192.168.0.75").isInRange(ip("192.168.0.1/24"))  //true
ip("192.168.0.75").isInRange(ip("192.168.0.1/28"))  //false
ip("1:2:3:4::/48").isInRange(ip("1:2:3:4::"))       //true
ip("192.168.0.1").isInRange(ip("1:2:3:4::"))        //false
```

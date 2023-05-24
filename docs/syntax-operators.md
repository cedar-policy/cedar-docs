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

Binary operator that evaluates to `true` if the string in the left operand matches the pattern string in the right operand. A pattern string can include one or more asterisks (`*`) as wildcard characters that match 0 or more of any character.

To match a literal asterisk character, use the escaped `\*` sequence in the pattern string.

### `decimal()` \(parse string and convert to decimal\)<a name="function-decimal"></a>

**Usage:** `decimal(<string>)`

Function that parses the string and tries to convert it to type [decimal](syntax-datatypes.md#datatype-decimal). If the string doesn't represent a valid decimal value, it generates an error.

To be interpreted successfully as a decimal value, the string must contain a decimal separator \(`.`\) and at least one digit before and at least one digit after the separator. There can be no more than 4 digits after the separator. The value must be within the valid range of the decimal type, from `-922337203685477.5808` to `922337203685477.5807`.

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

Binary operator that compares two operands of any type and evaluates to `true` only if they are exactly the same type and the same value. 

If the operands are of different types, the result is always `false`. For example, Cedar does not consider the number 5 to be equal to the string "5". 

### `!=` \(inequality\)<a name="operator-inequality"></a>

**Usage:** `<any type> != <any type>`

Binary operator that compares two operands of any type and evaluates to `true` if the operands have different values or are of different types.

### `<` \(long integer 'less than'\)<a name="operator-lessthan"></a>

**Usage:** `<long> < <long>`

Binary operator that compares two long integer operands and evaluates to `true` if the left operand is numerically less than the right operand.

### `.lessThan()` \(decimal 'less than'\)<a name="function-lessThan"></a>

**Usage:** `<decimal>.lessThan(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically less than the right operand.

### `<=` \(long integer 'less than or equal'\)<a name="operator-lessthanorequal"></a>

**Usage:** `<long> <= <long>`

Binary operator that compares two long integer operands and evaluates to `true` if the left operand is numerically less than or equal to the right operand.

### `.lessThanOrEqual()` \(decimal 'less than or equal'\)<a name="function-lessThanOrEqual"></a>

**Usage:** `<decimal>.lessThanOrEqual(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically less than or equal to the right operand.

### `>` \(long integer 'greater than'\)<a name="operator-greaterthan"></a>

**Usage:** `<long> > <long>`

Binary operator that compares two long integer operands and evaluates to `true` if the left operand is numerically greater than the right operand.

### `.greaterThan()` \(decimal 'greater than or equal'\)<a name="function-greaterThan"></a>

**Usage:** `<decimal>.greaterThan(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically greater than the right operand.

### `>=` \(Long integer 'greater than or equals'\)<a name="operator-greaterthanorequal"></a>

**Usage:** `<long> >= <long>`

Binary operator that compares two long integer operands and evaluates to `true` if the left operand is numerically greater than or equal to the right operand.

### `.greaterThanOrEqual()` \(decimal 'greater than or equal'\)<a name="function-greaterThanOrEqual"></a>

**Usage:** `<decimal>.greaterThanOrEqual(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically greater than or equal to the right operand.

## Logical operators<a name="operators-logical"></a>

Use these operators to logically combine Boolean values or expressions.

### `&&` \(AND\)<a name="operator-and"></a>

**Usage:** `<Boolean> && <Boolean>`

Binary operator that evaluates to `true` only if both arguments are `true`. 

This operator uses [short circuit evaluation](https://wikipedia.org/wiki/Short-circuit_evaluation). If the first argument is `false`, then the expression immediately evaluates to `false` and the second argument isn't evaluated. This approach is useful when the second argument might result in an error if evaluated. You can use the first argument to test that the second argument is a valid expression. For example, consider the following expression. It evaluates to `true` if the `principal` has the `numberOfLaptops` property and that property is set to a value less than 5:

```
principal has numberOfLaptops && principal.numberOfLaptops < 5
```

The second comparison in this expression is valid only if the `numberOfLaptops` property for the `principal` entity has a value. If it doesn't, the less than operator generates an error. The first expression uses the [**has**](#operator-has) operator to ensure that the `principal` entity does have such a property with a value. If that evaluates to `false`, there is no test of the second expression.

### `||` \(OR\)<a name="operator-or"></a>

**Usage:** `<Boolean> || <Boolean>`

Binary operator that evaluates to `true` if either one or both arguments are `true`.

This operator uses [short circuit evaluation](https://wikipedia.org/wiki/Short-circuit_evaluation). If the first argument is `true`, then the expression immediately evaluates to `true` and the second argument isn't evaluated. This approach is useful when the second argument might result in an error if evaluated. The first argument should be a test that can determine if the second argument is a valid expression. For example, consider the following expression. It evaluates to `true` if the principal can't be confirmed to at least 21 years old and `principal` is either missing the `age` property or that property is set to a value less than 21.

```
!(principal has age) || principal.age < 21 
```

The second comparison in this expression is valid only if the `age` property for the `principal` entity is present. If it is missing, the less than operator generates an error. The first expression uses the [**has**](#operator-has) operator, inverted by the `!` **[NOT](#operator-not)** operator, to flag that the `principal` entity is missing the `age` property. If that evaluates to `true`, there is no test of the second expression.

### `!` \(NOT\)<a name="operator-not"></a>

**Usage:** ` ! <Boolean>`

Unary operator with only one argument. It inverts the value of the Boolean operand from `true` to `false`, or from `false` to `true`. 

## Arithmetic operators<a name="operators-math"></a>

Use these operators to perform arithmetic operations on long integer values. 

**Notes**  
The arithmetic operators support ***only*** values of type `Long`. They don't support values of type `Decimal`.
There is no operator for arithmetic division.
The arithmetic operators generate errors if they overflow out of the `Long` integer range from `-9223372036854775808` to `9223372036854775807`.

### `+` \(Numeric addition\)<a name="operator-add"></a>

**Usage:** `<long> + <long>`

Binary operator that adds the two long integer values and returns a long integer sum.

### `-` \(Numeric subtraction or negation\)<a name="operator-subtract"></a>

**Usage:** `<long> - <long>`

As a binary operator with two operands, it subtracts the second long integer value from the first and returns a long integer difference.

**Usage:** `- <long>`

As a unary operator with one operand, it returns the negative of the value.

### `*` \(Numeric multiplication\)<a name="operator-multiply"></a>

**Usage:** `<long> * <long>`

Binary operator that multiplies two long integer values and returns a long integer product. One of the values *must* be an integer literal, the other value can be an integer literal or an expression that evaluates to an integer value. 

{: .note }
>There is no operator for arithmetic division.

## Hierarchy and set membership operators and functions<a name="functions-set"></a>

Use these functions to test if entities are members of a hierarchy or a set.

### <a name="operators-comparison"></a>

#### `in` \(Hierarchy membership\)<a name="operator-in"></a>

**Usage:** `<entity> in <entity>`

Boolean operator that evaluates to `true` if the entity in the left operand is a descendant in the hierarchy under the entity in the right operand.

The `in` operator is transitive. If `A` is in `B`, and `B` is in `C`, then `A` is also in `C`. This approach allows you to model the concept of a multi-tier hierarchy, for example nesting folders in other folders.

The `in` operator is reflexive; If the right operand is a single entity, then the expression evaluates to `true` if the right entity is the same as the left entity. In other words, an entity is *always* in its own hierarchy. `A` is always in `A`.

**Usage:** `<entity> in set(<entity>, <entity>, ...)`

If the right operand is a set of entities, then the expression is evaluated for each member in the set. For example, consider the following expression.

```
A in [ B, C, D ]
```

That expression is evaluated as component expressions joined by the [logical OR operator](#operator-or), as shown in the following example.

```
A in B || A in C || A in D 
```

If any one or more of the component expressions evaluates to `true`, then the overall expression evaluates to `true`.

For example, assume that the `principal` in a request is `User::"12345"`

```
// True. Testing if a value is in itself always returns true
principal in User::"12345"     

// True. Testing if a value is in a set consisting of only itself always returns true
principal in [User::"12345"]

// True if User::"12345" belongs to Group::"67890"
principal in Group::"67890"

// True if User::"12345" belongs to Group::"67890"
principal in [Group::"67890"]
```

### `has` \(presence of attribute test\)<a name="operator-has"></a>

**Usage:** `<entity> has <attribute>`

Boolean operator that evaluates to `true` if the left operand has a value defined for the specified attribute. Use this operator to check that a value is present before accessing that value. If you attempt to access a value that isn't defined, then Cedar generates an error. The following example expression first tests whether the entity `A` has a defined attribute `B`. Because the [&&](#operator-and) operator uses shortcut logic, the second expression is evaluated and the attribute accessed *only* if the attribute is present.

```
A has B && A.B == 5
```

### `.contains()` \(single element set membership test\)<a name="function-contains"></a>

**Usage:** `<set>.contains(<entity>)`

Function that evaluates to `true` if the operand is a member of the receiver on the left side of the function. The receiver must be of type `set`.

### `.containsAll()` \(all element set membership test\)<a name="function-containsAll"></a>

**Usage:** `<set>.containsAll(<set>)`

Function that evaluates to `true` if *every* member of the operand set is a member of the receiver set. Both the receiver and the operand must be of type `set`.

```
//true
[1, -22, 34].containsAll([-22, 1])

//true
[1, -22, 34].containsAll([-22])

//true
[43, 34].containsAll([34, 43])

//false
[1, -2, 34].containsall([1, -22])

//false
[1, 34].containsAll [1, 101, 34]

//true
[false, 3, [47, 0], "foo"].containsAll([3, "foo"])

//true
[false, 3, [47, 0], {"2": "ham"}].containsAll([3, {"2": "ham"}])

//true
[2, 43].containsAll([])

//false
[].containsAll([2, 43])

//type error - operand a string
[false, 3, [47, 0], "foo"].containsAll("foo")

//type error - prefix and operand are strings
"ham and eggs".containsAll("ham")

//type error - prefix and operand are records
{"2": "ham", "3": "eggs "}.containsAll({"2": "ham"})
```

### `.containsAny()` \(any element set membership test\)<a name="function-containsAny"></a>

**Usage:** `<set>.containsAny(<set>)`

Function that evaluates to `true` if *any one or more* members of the operand set is a member of the receiver set. Both the receiver and the operand must be of type `set`.

```
//true
[1, -22, 34].containsAny([1, -22])

//true
[1, -22].containsAny([1, -22, 34])

//true
[-22].containsAny([1, -22, 34])

//true
[1, 101].containsAny([1, -22, 34])

//false
[1, 101].containsAny([-22, 34])

//true
["alice","bob","charlie"].containsAny(["david","bob","juan"])

//false
[].containsAny(["bob"])

//false
["bob"].containsAny([])

//type error - operand is a string
"ham".containsAny("ham and eggs")

//type error - prefix and operands are records
{"2": "ham"}.containsAny({"2": "ham", "3": "eggs "})
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

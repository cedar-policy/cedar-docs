---
layout: default
title: Operators
nav_order: 4
---
<!-- markdownlint-disable-file MD024 MD026 MD040 -->

# Operators and functions to use in Cedar {#syntax-operators}
{: .no_toc }

This topic describes the built-in operators and functions that you can use to build your expressions using the Cedar policy language.

Not all expressions that you can _evaluate_ will necessarily _validate_ when using Cedar's [policy validator](validation.html#validation). This situation is similar to that of most programming languages. For example, in Java the following code does not type check, even though executing it will never result in an error.
```java
if (false) { return 1 == "hello"; } else { return true; }
```
A key difference between Java and Cedar is that Java typechecking is _mandatory_ -- you cannot run a Java program that does not typecheck -- whereas for Cedar policy validation is _optional_ -- it is still possible to evaluate policies that do not validate. This allows you to get up and running with Cedar faster, and to write more expressive policies, if need be. Of course, the restrictions imposed by validation come with the benefit that valid policies are sure not to exhibit most kinds of evaluation error. See the [policy validation]((validation.html#validation)) section for more information.

When giving examples below, we will indicate whether the example evaluates properly (and to what), and also whether it validates. All expressions that fail to evaluate will also fail to validate, but not vice versa.

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Overview of operators {#operators-overview}

The operators use the following syntax structures:

+ **Unary operators** &ndash; A unary operator takes one operand. Place the operand after the operator.

  ```cedar
  <operator> operand

  // Uses the logical NOT operator and evaluates to the
  // inverse of the value of the boolean operand
  ! a
  ```

+ **Binary operators** &ndash; A binary operator takes two operands. Place one operand before the operator and one after. Some binary operators are [commutative](https://wikipedia.org/wiki/Commutative_property). See the description of each operator to understand where operand order matters.

  ```cedar
  firstOperand <operator> secondOperand

  // Evaluates to true if both operands have the same type and value
  a == b

  // Evaluates to true if the first operand is within the
  // hierarchy of the second operand
  c in d
  ```

Functions use one of two styles of syntax:

+ Constructor-style: Place any operands in parentheses after the function name, separating them with commas.

  ```cedar
  function(firstOperand, secondOperand, …)

  // creates an IP address
  ip("127.0.0.1")
  ```

+ Method-style: Append the function name to the end of the target parameter, separating them with a `.` \(period\) character. Place any operands in parentheses after the function name, separating them with commas.

  ```cedar
  firstOperand.function(secondOperand, thirdOperand, …)

  // Evaluates to true if the any of the set member
  // elements b, c, or d is an element of set a
  a.containsAny([b, c, d])
  ```

## String operators and functions {#operators-string}

Use these operators and functions to compare strings or convert them to other types.

### `like` \(string matching with wildcard\) {#operators-string-like}

**Usage:** `<string> like <string possibly with wildcards>`

Binary operator that evaluates to `true` if the string in the left operand matches the pattern string in the right operand. The pattern string can include one or more asterisks (`*`) as wildcard characters that match 0 or more of any character.

To match a literal asterisk character, use the escaped `\*` sequence in the pattern string.

Consider a query with the following context:

```json
"context": {
    "location": "s3://bucketA/redTeam/some/thing"
}
```

In that scenario, the following expression returns `true`.

```cedar
context.location like "s3:*"         //true
```

#### More Examples:
{: .no_toc }

```cedar
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



### `decimal()` \(parse string and convert to decimal\) {#function-decimal}

**Usage:** `decimal(<string>)`

Function that parses the string and tries to convert it to type [decimal](syntax-datatypes.html#datatype-decimal). If the string doesn't represent a valid decimal value, it generates an error.

To be interpreted successfully as a decimal value, the string must contain a decimal separator \(`.`\) and at least one digit before and at least one digit after the separator. There can be no more than 4 digits after the separator. The value must be within the valid range of the decimal type, from `-922337203685477.5808` to `922337203685477.5807`.

Cedar can properly evaluate `decimal(e)` where `e` is any Cedar expression that evaluates to a valid string. For example, the expression `decimal(if true then "1.1" else "2.1")` will evaluate to the decimal number `1.1`. However, Cedar's [policy validator](validation.html#validation) only permits `e` to be a _string literal_ that will not result in an error or overflow.

#### Examples:
{: .no_toc }

In the examples below, suppose `context.time` is `"12.25"` while `context.date` is `"12/27/91"`. Examples labeled `error` indicate both a validation and evaluation error. Unlabeled examples evaluate and validate correctly.

```cedar
decimal("1.0")
decimal("-1.0")
decimal("123.456")
decimal("0.1234")
decimal("-0.0123")
decimal("55.1")
decimal("00.000")
decimal(context.time)            //Evaluates //Doesn't validate (parameter not a string literal)
decimal(context.date)            //error - invalid format (not valid as parameter not a string literal)
decimal("1234")                  //error - missing decimal
decimal("1.0.")                  //error - stray period at end
decimal("1.")                    //error - missing fractional part
decimal(".1")                    //error - missing whole number part
decimal("1.a")                   //error - invalid fractional part
decimal("-.")                    //error - invalid format
decimal("1000000000000000.0")    //error - overflow
decimal("922337203685477.5808")  //error - overflow
decimal("0.12345")               //error - too many fractional digits
```

### `ip()` \(parse string and convert to ipaddr\) {#function-ip}

**Usage:** `ip(<string>)`

Function that parses the string and attempts to convert it to type `ipaddr`. If the string doesn't represent a valid IP address or range, then the `ip()` expression generates an error when evaluated.

Cedar can properly evaluate `ip(e)` where `e` is any Cedar expression that evaluates to a valid string. For example, the expression `ip(if true then "1.1.1.1/24" else "2.1.1.1/32")` will evaluate to the IP address `1.1.1.1/24`. However, Cedar's [policy validator](validation.html#validation) only permits `e` to be a _string literal_.

#### Examples:
{: .no_toc }

In the examples below, suppose `context.addr` is `"12.25.27.15"` while `context.date` is `"12/27/91"`. Examples labeled `error` indicate both a validation and evaluation error. Unlabeled examples evaluate and validate correctly.

```cedar
ip("127.0.0.1")
ip("::1")
ip("127.0.0.1/24")
ip("ffee::/64")
ip("ff00::2")
ip("::2")
ip(context.addr)                    //Evaluates //Doesn't validate (parameter not a string literal)
ip(context.time)                    //error - invalid format (not valid as parameter not a string literal)
ip("380.0.0.1")                     //error – invalid IPv4 address
ip("ab.ab.ab.ab")                   //error – invalid IPv4 address
ip("127.0.0.1/8/24")                //error – invalid CIDR notation
ip("fee::/64::1")                   //error – invalid IPv6 address
ip("fzz::1")                        //error – invalid character in address
ip([127,0,0,1])                     //error – invalid operand type
"127.0.0.1".ip()                    //error – invalid call style
```

The following examples all evaluate correctly, but the last two do not validate as the validator requires `==` expressions to be applied to expressions of the same type (see the [discussion of `==`](#operator-equality) below).

```cedar
ip("127.0.0.1") == ip("127.0.0.1")            //true
ip("192.168.0.1") == ip("8.8.8.8")            //false
ip("192.168.0.1/24") == ip("8.8.8.8/8")       //false
ip("192.168.0.1/24") == ip("192.168.0.8/24")  //false - different host address
ip("127.0.0.1") == ip("::1")                  //false – different IP versions
ip("127.0.0.1") == ip("192.168.0.1/24")       //false - address compared to range
ip("127.0.0.1") == "127.0.0.1"                //false – different types //Doesn't validate
ip("::1") == 1                                //false – different types //Doesn't validate
```

## Comparison operators and functions {#operators-comparison}

Use these operators to compare two values. An expression that uses one of these operators evaluates to a boolean `true` or `false`. You can then combine multiple expressions using the logical operators.

### `==` \(equality\) {#operator-equality}

**Usage:** `<any type> == <any type>`

Binary operator that compares two operands of any type and evaluates to `true` only if they are exactly the same type and the same value.

While Cedar can _evaluate_ expressions `e1 == e2` when `e1` and `e2` have different types (usually giving the result `false`), such comparison expressions are not accepted by the policy validator. In particular, policies containing equality expressions `e1 == e2` are only validated when

1. Both `e1` and `e2` have the same type, or
2. Both have entity type, though that type need not be the same

#### Examples:
{: .no_toc }

All of the examples below evaluate successfully, and are labeled with their evaluation result. Those examples that do not validate (the last two) are labeled as such.

```cedar
1 == 1                          //true
"something" == "something"      //true
"Something" == "something"      //false
[1, -33, 707] == [1, -33]       //false
[1, 2, 40] == [1, 2, 40]        //true
[1, 2, 40] == [1, 40, 2]        //true
[1, -2, 40] == [1, 40]          //false
[1, 1, 1, 2, 40] == [40, 1, 2]  //true
[1, 1, 2, 1, 40, 2, 1, 2, 40, 1] == [1, 40, 1, 2]   //true
true == true                    //true
context.device_properties == {"os": "Windows", "version": 11}
                                //true if context.device_properties represents a Windows 11 computer
User::"alice" == User::"alice"  //true
User::"alice" == User::"bob"    //false -- two different entities of same type
User::"alice" == Admin::"alice" //false -- entities of two different types //Validates
5 == "5"                        //false -- operands have two different types //Doesn't validate
"alice" == User::"alice"        //false -- operands have two different types //Doesn't validate
```

### `!=` \(inequality\) {#operator-inequality}

**Usage:** `<any type> != <any type>`

Binary operator that compares two operands of any type and evaluates to `true` if the operands have different values or are of different types. You can use `!=` ***only*** in `when` and `unless` clauses. As with the `==` operator, the validator only accepts policies that use `!=` on two expressions of (possibly differing) entity type, or the same non-entity type.

#### Example:
{: .no_toc }

```cedar
forbid (principal, action, resource)
when{
    resource.tag != "public"
};
```

### `<` \(long integer 'less than'\) {#operator-lessthan}

**Usage:** `<long> < <long>`

Binary operator that compares two `long` integer operands and evaluates to `true` if the left operand is numerically less than the right operand. If either operand is not a `long` then evaluation (and validation) results in an error.

#### Examples:
{: .no_toc }

In the following examples, `//error` indicates both an evaluation and a validation error.

```cedar
3 < 303               //true
principal.age < 22    //true (assuming principal.age is 21)
3 < "3"               //error - operator not allowed on non-long
false < true          //error - operator not allowed on non-long
"" < "zzz"            //error - operator not allowed on non-long
[1, 2] < [47, 0]      //error - operator not allowed on non-long
```

### `.lessThan()` \(decimal 'less than'\) {#function-lessThan}

**Usage:** `<decimal>.lessThan(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically less than the right operand. If either operand is not a `decimal` then evaluation (and validation) results in an error.

#### Examples:
{: .no_toc }

In the following examples, `//error` indicates both an evaluation and a validation error.

```cedar
decimal("1.23").lessThan(decimal("1.24"))     //true
decimal("1.23").lessThan(decimal("1.23"))     //false
decimal("123.45").lessThan(decimal("1.23"))   //false
decimal("-1.23").lessThan(decimal("1.23"))    //true
decimal("-1.23").lessThan(decimal("-1.24"))   //false
decimal("1.1").lessThan(2)                    //error -- not a decimal operand
ip("1.1.2.3").lessThan(decimal("1.2"))        //error -- not a decimal operand
```

### `<=` \(long integer 'less than or equal'\) {#operator-lessthanorequal}

**Usage:** `<long> <= <long>`

Binary operator that compares two `long` integer operands and evaluates to `true` if the left operand is numerically less than or equal to the right operand. If either operand is not a `long` then evaluation (and validation) results in an error.

#### Examples:
{: .no_toc }

In the following examples, `//error` indicates both an evaluation and a validation error.

```cedar
3 <= 303               //true
principal.age <= 21    //true (assuming principal.age is 21)
3 <= "3"               //error - operator not allowed on non-long
false <= true          //error - operator not allowed on non-long
"" <= "zzz"            //error - operator not allowed on non-long
[1, 2] <= [47, 0]      //error - operator not allowed on non-long
```

### `.lessThanOrEqual()` \(decimal 'less than or equal'\) {#function-lessThanOrEqual}

**Usage:** `<decimal>.lessThanOrEqual(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically less than or equal to the right operand.  If either operand is not a `decimal` then evaluation (and validation) results in an error.

#### Examples:
{: .no_toc }

In the following examples, `//error` indicates both an evaluation and a validation error.

```cedar
decimal("1.23").lessThanOrEqual(decimal("1.24"))    //true
decimal("1.23").lessThanOrEqual(decimal("1.23"))    //true
decimal("123.45").lessThanOrEqual(decimal("1.23"))  //false
decimal("-1.23").lessThanOrEqual(decimal("1.23"))   //true
decimal("-1.23").lessThanOrEqual(decimal("-1.24"))  //false
decimal("1.1").lessThanOrEqual(2)                   //error -- not a decimal operand
ip("1.1.2.3").lessThanOrEqual(decimal("1.2"))       //error -- not a decimal operand
```

### `>` \(long integer 'greater than'\) {#operator-greaterthan}

**Usage:** `<long> > <long>`

Binary operator that compares two `long` integer operands and evaluates to `true` if the left operand is numerically greater than the right operand. If either operand is not a `long` then evaluation (and validation) results in an error.

#### Examples:
{: .no_toc }

In the following examples, `//error` indicates both an evaluation and a validation error.

```cedar
3 > 303                //false
principal.age > 22     //false (assuming principal.age is 21)
3 > "3"                //error - operand is a non-long
false > true           //error - operands are not long integers
"some" > "thing"       //error - operands are not long integers
```

### `.greaterThan()` \(decimal 'greater than'\) {#function-greaterThan}

**Usage:** `<decimal>.greaterThan(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically greater than the right operand.  If either operand is not a `decimal` then evaluation (and validation) results in an error.

#### Examples:
{: .no_toc }

In the following examples, `//error` indicates both an evaluation and a validation error.

```cedar
decimal("1.23").greaterThan(decimal("1.24"))    //false
decimal("1.23").greaterThan(decimal("1.23"))    //false
decimal("123.45").greaterThan(decimal("1.23"))  //true
decimal("-1.23").greaterThan(decimal("1.23"))   //false
decimal("-1.23").greaterThan(decimal("-1.24"))  //true
decimal("1.1").greaterThan(2)                   //error -- not a decimal operand
ip("1.1.2.3").greaterThan(decimal("1.2"))       //error -- not a decimal operand
```
The `greaterThan` function must take two `decimal` operands or else it will produce an error when evaluated, per the last two examples. The policy validator also rejects also any expression that attempts to call `greaterThan` on non-`decimal` values.

### `>=` \(long integer 'greater than or equal'\) {#operator-greaterthanorequal}

**Usage:** `<long> >= <long>`

Binary operator that compares two `long` integer operands and evaluates to `true` if the left operand is numerically greater than or equal to the right operand. If either operand is not a `long` then evaluation (and validation) results in an error.

#### Examples:
{: .no_toc }

In the following examples, `//error` indicates both an evaluation and a validation error.

```cedar
3 >= 303               //false
principal.age >= 21    //true (assuming principal.age is 21)
3 >= "3"               //error - operand is a non-long
false >= true          //error - operands are not long integers
"some" >= "thing"      //error - operands are not long integers
```
As shown in the examples, evaluating an expression with `>=` when the operators are not both `long` numbers results in an error. The policy validator also rejects also any expression that attempts to compare two values with `>=` that do not have type `long`.

### `.greaterThanOrEqual()` \(decimal 'greater than or equal'\) {#function-greaterThanOrEqual}

**Usage:** `<decimal>.greaterThanOrEqual(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically greater than or equal to the right operand. If either operand is not a `decimal` then evaluation (and validation) results in an error.

#### Examples:
{: .no_toc }

```cedar
decimal("1.23").greaterThanOrEqual(decimal("1.24"))    //false
decimal("1.23").greaterThanOrEqual(decimal("1.23"))    //true
decimal("123.45").greaterThanOrEqual(decimal("1.23"))  //true
decimal("-1.23").greaterThanOrEqual(decimal("1.23"))   //false
decimal("-1.23").greaterThanOrEqual(decimal("-1.24"))  //true
```

## Logical operators {#operators-logical}

Use these operators on boolean values or expressions.

### `&&` \(AND\) {#operator-and}

**Usage:** `<boolean> && <boolean>`

Binary operator that evaluates to `false` if the first evaluates to `false`, or if the first evaluates to `true` and the second evaluates to `false`. Evaluates to `true` only if both arguments evaluate to `true`.

In the following policy, the `when` condition is `true` if both `principal.numberOfLaptops < 5` and `principal.jobLevel > 6` evaluate to `true`.

```cedar
permit (principal, action == Action::"remoteAccess", resource)
when {
    principal.numberOfLaptops < 5 &&
    principal.jobLevel > 6
};
```

The `&&` operator uses [short circuit evaluation](https://wikipedia.org/wiki/Short-circuit_evaluation). If the first argument is `false`, then the expression immediately evaluates to `false` and the second argument isn't evaluated. This approach is useful when the second argument might result in an error if evaluated. You can use the first argument to test that the second argument is a valid expression.

The following policy is satisfied only if the principal has the attribute `level` and the `level > 5`.

```cedar
permit (principal, action == Action:"read", resource)
when {
    principal has level &&
    principal.level > 5
};
```

The `>` comparison in this expression can only succeed if the  `principal` entity has a `level` attribute. If it doesn't, then `principal.level` sub-expression would evaluate to an error. The expression that is the first operand of `&&` uses the [`has`](#operator-has) operator to ensure that the `principal` entity does have such an attribute. If that evaluates to `false`, then the second operand to `&&` isn't evaluated.

The description of `&&` so far has been from the perspective of _evaluation_. From the perspective of policy _validation_, the situation is a little different. In general, the validator will reject any expression `e1 && e2` that would evaluate to an error due to either `e1` or `e2` not having `boolean` type. However, the validator _sometimes_ is able to take short-circuiting into account. We will elaborate when considering the examples below.

#### More Examples:
{: .no_toc }

In the following examples, those labeled with `//error` both fail to evaluate and fail to validate. Others evaluate correctly, but some may fail to validate, per the label. Discussion of the reasons for non-validation is given below.

```cedar
3 && false                                  //error -- first operand is not a boolean
false && 3                                  //Evaluates to false (due to short circuiting) //Validates
(3 == 4) && 3                               //Evaluates to false (due to short circuiting) //Doesn't validate
(User::"alice" == Action::"viewPhoto") && 3 //Evaluates to false //Validates
true && 3                                   //error -- second operand is not a boolean
(false && 3) == 3                           //Evaluates to false //Doesn't validate (== applied to different types)
```

As mentioned above, validation _sometimes_ is able to account for short-circuiting behavior, but not always. In particular, the validator will accept `false && 3` and `(User::"alice" == Action::"viewPhoto") && 3`, but not `(3 == 4) && 3`. The reason is that it knows `false` is always, well, `false`, so it can model short-circuiting. 

### `||` \(OR\) {#operator-or}

**Usage:** `<boolean> || <boolean>`

Binary operator that evaluates to `true` if the first operand evaluates to `true`, or the first evaluates to `false` and the second operand evaluates to `true`. Evaluates to `false` if both operands evaluate to `false`.

This operator uses [short circuit evaluation](https://wikipedia.org/wiki/Short-circuit_evaluation). If the first argument is `true`, then the expression immediately evaluates to `true` and the second argument isn't evaluated. This approach is useful when the second argument might result in an error if evaluated. The first argument should be a test that can determine if the second argument is safe to evaluate. For example, consider the following expression. It evaluates to `true` if the principal is either missing the `age` attribute or that attribute is at least 21.

```cedar
!(principal has age) || principal.age < 21
```

The second comparison in this expression will evaluate to a boolean only if the `age` attribute for the `principal` entity is present. If it is missing, then `principal.age` will evaluate to an error. The first expression uses the [`has`](#operator-has) operator, inverted by the `!` **[NOT](#operator-not)** operator, to flag that the `principal` entity is missing the `age` property. If that evaluates to `true`, there is no test of the second expression.

The following policy allows if either `resource.owner == principal` or `resource.tag == "public"` is true.

```cedar
permit (principal, action == Action:"read", resource)
when {
    resource.owner == principal ||
    resource.tag == "public"
};
```

The description so far is from the perspective of _evaluation_. From the perspective of policy _validation_, the situation is a little different. In general, the validator will reject any expression `e1 || e2` that would evaluate to an error due to either `e1` or `e2` not having `boolean` type. The validator _sometimes_ is able to take short-circuiting into account, as discussed using the examples below.

#### More Examples:
{: .no_toc }

In the following examples, those labeled with `//error` both fail to evaluate and fail to validate. Others evaluate correctly, but some may fail to validate, per the label. Discussion of the reasons for non-validation is given below.

```cedar
3 || true                  //error (first operand not a boolean)
true || 3                  //Evaluates to true (due to short-circuiting) //Validates
false || 3                 //error (second operand not a boolean)
(3 == 3) || 3              //Evaluates to true (due to short-circuiting) //Doesn't validate
```

As mentioned above, validation _sometimes_ is able to account for short-circuiting behavior, but not always. In particular, the validator will accept `true || 3` but not `(3 == 3) && 3`.

### `!` \(NOT\) {#operator-not}

**Usage:** `! <boolean>`

Unary operator with only one argument. It inverts the value of the boolean operand from `true` to `false`, or from `false` to `true`. If either operand is not a `boolean` then evaluation (and validation) results in an error.

#### Example:
{: .no_toc }

The following policy forbids if the principal does not belong to Group::"family".

```cedar
forbid (principal, action, resource)
when {
    !(principal in Group::"family")
};
```

You can rewrite the above policy using an `unless` clause as:

```cedar
forbid (principal, action, resource)
unless {
  principal in Group::"family"
};
```

#### More Examples:
{: .no_toc }

In the following examples, those labeled with `//error` both fail to evaluate and fail to validate.

```cedar
! true                                //false
! false                               //true
! 8                                   //error
if !true then "hello" else "goodbye"  //"goodbye"
```

### `if` \(CONDITIONAL\) {#operator-if}

**Usage:** `if <boolean> then <T> else <U>`

The `if` operator returns its evaluated second argument if the first argument evaluates to `true`, else it returns the evaluated third argument.

The `if` operator requires its first argument to be a boolean, i.e., to evaluate to either `true` or `false`. If it does not, the `if` evaluates to an error. The second and third arguments can have any type; to be compatible with [validation](validation.,html), both arguments usually must have the _same_ type, but sometimes the validator is able to take `if`'s short-circuiting behavior into account; more details below.

In the following policy, the `when` condition is `true` if both `principal.numberOfLaptops < 5` and `principal.jobLevel > 6` are `true`.

```cedar
permit (principal, action == Action::"remoteAccess", resource)
when {
    if principal.numberOfLaptops < 5 then
      principal.jobLevel > 6
    else false
};
```

The `if` operator uses [short circuit evaluation](https://wikipedia.org/wiki/Short-circuit_evaluation). When the first argument evaluates to `true` the third argument is never evaluated. When the first argument evaluates to `false`, the second argument is never evaluated.

The `if` operator is a strict generalization of the `&&` and `||` operators. The expression `_e1_ || _e2_` is equivalent to the expression `if` `_e1_` `then` `true` `else` (`if` `_e2_` `then` `true` `else` `false`). The expression `_e1_ && _e2_` is equivalent to the expression `if` `_e1_` `then` (`if` `_e2_` `then` `true` `else` `false`) `else` `false`. Note that `_e1_` `||` `_e2_` is _not_ equivalent to `if` `_e1_` `then` `true` `else` `_e2_`, due to the possibility of type errors. To see why, consider that `false` `||` `"foo"` produces a type error, while `if false then true else "foo"` evaluates to `"foo"`.

Note that `if` and `when`, though similar in normal English, play different roles in Cedar. The keyword `when` is part of the _policy syntax_ which simply connects the policy scope to the policy's condition(s). The keyword `if` is a part of an _expression_ that can be contained in such a condition, and can be evaluated against a relevant authorization request.

#### More Examples:
{: .no_toc }

In the following examples, those labeled with `//error` both fail to evaluate and fail to validate. Others evaluate correctly, but some may fail to validate, per the label. Discussion of the reasons for non-validation is given below.

```cedar
if 1 == 1 then "ok" else "wrong"         //Evaluates to "ok" //Validates
if 1 == 2 then User::"foo" else "ok"     //Evaluates to "ok" //Doesn't validate
if 1 then "wrong" else "wrong"           //error
if false then (1 && "hello") else "ok"   //Evaluates to "ok" (due to short circuiting) //Validates
if true then (1 && "hello") else "ok"    //error
```

The example `if 1 == 1 then "ok" else "wrong"` validates because the first operand `1 == 1` has `boolean` type, and both the second and third operands have the same type (`String`). The example `if 1 == 2 then User::"foo" else "ok"` doesn't validate because the second and third operands do not have the same type. The example `if 1 then "wrong" else "wrong"` doesn't validate because the first operand `1` does not have type `boolean`. The example `if false then (1 && "hello") else "ok"` is _accepted_ (validates) because the validator is able to consider short-circuiting.

## Arithmetic operators {#operators-math}

Use these operators to perform arithmetic operations on `long` integer values.

**Notes**
The arithmetic operators support ***only*** values of type `long`. They don't support values of type `Decimal`.
There is no operator for arithmetic division.

{: .warning }
>If you exceed the range available for the `long` data type by using any of the arithmetic operators, it results in an overflow error. In general, a policy that results in an error is ignored, meaning that a `permit` policy might unexpectedly fail to allow access, or a `forbid` policy might unexpectedly fail to block access.

### `+` \(numeric addition\) {#operator-add}

**Usage:** `<long> + <long>`

Binary operator that adds the two `long` integer values and returns a `long` integer sum; it evaluates (and validates) to an error if given non-`long` operands. Addition could result in an overflow evaluation error; such errors are *not* detected by the validator.

#### Example:
{: .no_toc }

The following policy returns `allow` if the context `budget` plus the context `downloaded` is greater than 100.

```cedar
permit (principal, action, resource)
when {
    context.budget + context.downloaded > 100
};
```

#### Other examples:
{: .no_toc }

In the following examples, those labeled with `//error` both fail to evaluate *and* fail to validate, except in the case of overflow, in which case evaluation produces an error but validation does not.

```cedar
11 + 0                              //11
-1 + 1                              //0
9223372036854775807 + 1             //error - overflow //Validates
7 + "3"                             //error - second operand not a long //Doesn't validate
"lamp" + "la"                       //error - operands not `long` //Doesn't validate
```

### `-` \(numeric subtraction or negation\) {#operator-subtract}

**Usage:** `<long> - <long>` or `- <long>`

As a binary operator with two operands, it subtracts the second `long` integer value from the first and returns a `long` integer difference. It evaluates (and validates) to an error if given non-`long` operands. Subtraction could result in an overflow evaluation error (underflow, more precisely); such errors are *not* detected by the validator.

#### Examples:
{: .no_toc }

In the following examples, those labeled with `//error` both fail to evaluate *and* fail to validate, except in the case of overflow, in which case evaluation produces an error but validation does not.

```cedar
-3                              //-3
44 - 31                         //13
5 - (-3)                        //8
-9223372036854775807 - 2 + 3    //error - overflow //Validates
7 - "3"                         //error - second operand not a `long` //Doesn't validate
```

Because the `-` symbol can mean both unary and binary subtraction, the example `-9223372036854775807 - 2 + 3` must use parentheses to disambiguate.

### `*` \(numeric multiplication\) {#operator-multiply}

**Usage:** `<long> * <long>`

Binary operator that multiplies two `long` integer operands and returns a `long` integer product. It evaluates (and validates) to an error if given non-`long` operands. Multiplication could result in an overflow evaluation error; such errors are *not* detected by the validator.

{: .note }
>There is no operator for arithmetic division.

#### Examples:
{: .no_toc }

In these examples, suppose that `resource.value` is 3 and `context.budget` is 4. Examples labeled with `//error` both fail to evaluate *and* fail to validate, except in the case of overflow, in which case evaluation produces an error but validation does not.

```cedar
10 * 20                          //200
resource.value * 10              //30
2 * context.budget > 100         //false
context.budget * resource.value  //depends on entity data
9223372036854775807 * 2          //error - overflow //Validates
5 * (-3)                         //-15
5 * 0                            //0
"5" * 0                          //error - both operands must have type `long` //Doesn't validate
```

## Hierarchy and set membership operators and functions {#functions-set}

Use these functions to test if entities are members of a hierarchy or a set.

### `in` \(hierarchy membership\) {#operator-in}

**Usage:** `<entity> in <entity>`

Binary operator that evaluates to `true` if the entity in the left operand is a descendant in the hierarchy under the entity in the right operand. Evaluation (and validation) produces an error if the first (lhs) operand of `in` is not an entity, or the (rhs) is not an entity or a set thereof (the latter usecase is discussed below).

The `in` operator is transitive. If `A` is in `B`, and `B` is in `C`, then `A` is also in `C`. This approach allows you to model the concept of a multi-tier hierarchy, for example nesting folders in other folders.

The `in` operator is reflexive. The expression evaluates to `true` if the right entity is the same as the left entity. In other words, an entity is *always* in its own hierarchy. `A` is always in `A`.

#### Examples:
{: .no_toc }

In these examples, assume that the `principal` in a request is `User::"bob"`, and that `User::"bob"` has `Group::"janefriends"` as a parent in the hierarchy, which in turn has `Group::"all"` as a parent. Examples labeled with `//error` both fail to evaluate and fail to validate.

```cedar
principal in User::"bob"             //true by reflexivity
principal in Group::"janefriends"    //true
Group::"janefriends" in Group::"all" //true
principal in Group::"all"            //true by transitivity
Group::"all" in User::"bob"          //false -- in is not symmetric
1 in Group::"janefriends"            //error -- LHS not an entity
```

**Usage:** `<entity> in set(<entity>)`

When the right operand is a _set_ of entities, then the expression evaluates to `true` if the left operand is `in` any of the entities in the set. If the left operand is not an entity or the right operand is not an entity or set of entities, then evaluation produces an error. Likewise, the validator requires the lhs to be an entity and the rhs to be an entity or set thereof, where in the latter case all the entities must have the same type.

As an example, consider the following expression.

```cedar
User::"bob" in [Group::"janefriends", Group::"joefriends"]
```

This expression is similar to

```cedar
User::"bob" in Group::"janefriends" || User::"bob" in Group::"joefriends"
```
In other words, if `User::"bob"` is `in` either `Group`, then the expression evaluates to `true`. However, `in` does not short-circuit evaluation -- it will test membership in _all_ elements. This is important for error reporting. In particular, the following expression

```cedar
User::"bob" in Group::"janefriends" || User::"bob" in 1
```

would evaluate to `true` because the second expression given to `||` is short-circuited, whereas

```cedar
User::"bob" in [Group::"janefriends", 1]
```

evaluates to an error (since `1` is not an entity).

The right operand of `in` can be any expression that evaluates to a set of entity references, not just a set literal. For example, suppose the query `context` record contains the following:

```json
{
    "groups ": [Group::"jane_family", Group::"jane_friends "]
}
```

Then the following two expressions in a policy statement are equivalent:

```cedar
User::"alice" in context.groups
User::"alice" in [Group::"jane_family", Group::"jane_friends"]
```

Because the in operator is reflexive, A `in` A returns true even if the entity A does not exist in the `entities` passed in with the request. The evaluator treats entity references that are not in the hierarchy as a valid entity. For example:

```cedar
Stranger::"jimmy" in Stranger::"jimmy"        //true by reflexivity.
Stranger::"jimmy" in Group::"jane_friends"    //false - Stranger::"jimmy" does not refer to an existing entity
Stranger::"jimmy" in [
    Group::"jane_family",
    Stranger::"jimmy"
]                                             //true - Stranger::"jimmy" in Stranger::"jimmy" is true
```

#### More Examples:
{: .no_toc }

These examples both fail to evaluate and fail to validate because their operands are invalid.

```cedar
"some" in ["some", "thing"] //error - these are strings, not entities. Use `contains` for set membership.
"os" in {"os":"Windows "}   //error - use `has` operator to check if a key exists
```

### `has` \(presence of attribute test\) {#operator-has}

**Usage:** `<entity or record> has <attribute>`

boolean operator that evaluates to `true` if the left operand has a value defined for the specified attribute. Evaluation (and validation) produces an error if lhs is not a record or entity type. We discuss evaluation, first, and validation in more depth further down.

#### Evaluation

Use this operator to check that a value is present before accessing that value. If an expression accesses an attribute that isn't present, then evaluation produces an error.

The following example expression first tests whether the entity `principal` has a defined attribute `manager`. Because the [&&](#operator-and) operator uses shortcut logic, the second expression to `&&` is evaluated and the attribute accessed *only* if the `has` check has deemed it is present.

```cedar
principal has manager && principal.manager == User::"kirk"
```

In the following example, assume that the request has the following context:

```json
"context":{
    "role": ["admin", "user"],
    "addr": { "street": "main", "city": "DC"}
    "owner info": { "name": "Alice", "age": 18 }
}
```

The following condition checks if the context has an attribute `role`. If the attribute exists, then it checks if it is a set containing the string `"admin"` as an element.

```cedar
context has role && context.role.contains("admin")       //true
```

The attribute name `role` can be written as an identifier (as in the previous example) or as a string literal. The following expression is equivalent to the previous one:

```cedar
context has "role" && context.role.contains("admin")     //true
```

You must check for presence of nested, optional attributes one layer at a time. For example, to check for the presence of `principal.custom.project` where both `custom` and `project` are optional, you must first check if `principal` has a `custom` attribute and then check that it `principal.custom` has a `project` attribute:

```cedar
principal has custom && principal.custom has project && principal.custom.project == "greenzone"
```

If the attribute name is not valid as an [identifier](syntax-grammar.html#grammar-ident), then the string literal syntax must be used for `has` and attribute values must be accessed with the `[]` operator instead of using dot syntax. For example, to check if `context` has an attribute called `owner info` (with an embedded space), then you could use the following syntax.

```cedar
context has "owner info" && context["owner info"].name == "Alice"    //true
```

The following expression returns false because `context` doesn't have an attribute `tag`.

```cedar
context has tag      //false
```

Evaluating the following expression results in an error because the left-hand side of the `has` operator must be an entity or a record.

```cedar
context.role has admin     //type error
```

The following expression returns `false` because the `addr` sub-record does not have an attribute `country`. The second expression is not evaluated.

```cedar
context.addr has country && context.addr.country == "US "    //false
```

However, consider the case where `context` does not have the `addr` sub-record at all:

```cedar
"context": {
    "role": ["admin", "user"]
}
```

In that case, then the previous expression that checks for `context.addr has country` raises a missing-attribute error on `context.addr` before the `has` operator is even evaluated, and the entire policy is skipped. If the `addr` sub-record is optional, you can avoid this error by checking whether `addr` is present before accessing it with the `.` operator:

```cedar
context has addr && context.addr has country && context.addr.country == "US"  // false, with no error
```

#### Validation

Validating `has` expressions relies on information specified in the [schema](../schema/schema.html#schema) about what entity and record types have what attributes, and which attributes might be optional. Suppose we have expression `context has role`. It can have the following types:

- Type `boolean` if the schema says `context` has a `role` attribute which is not required, i.e., it's optional
- Type `True` if the schema says `context` has a `role` attribute which _is_ required, which means the expression will always evaluate to `true`
- Type `False` if the schema says `context` does not have a `role` attribute, which means that the expression will always evaluate to `false`

Recall that types `True` and `False` are used internally by the validator for simulating the evaluator's short-circuiting behavior for [`&&`](#operator-and) and [`||`](#operator-or).

The validator will reject any `has` expression whose left-hand operand is not an expression whose type is an entity or record.

### `.hasTag()` \(presence of tag test\) {#operator-hasTag}

**Usage:** `<entity>.hasTag(<expr>)`

Method that evalutes to `true` if the entity on the left has a value defined for the tag name specified on the right. Unlike for attributes with [`has`](#operator-has), for tags the tag name may be any (string-typed) expression, and does not have to be a string literal. Evaluation (and validation) produces an error if `<entity>` is not an entity or if `<expr>` does not evaluate to a string.

In all other respects, `.hasTag()` behaves similarly to [`has`](#operator-has) except that it
operates on tags instead of attributes. (And only entities, not records, can have tags.)

Calling `.hasTag()` on an entity type without a `tags` declaration is valid and will return `false` without a validation error, because entities of that type cannot have tags.

### `.getTag()` \(tag access\) {#operator-getTag}

**Usage:** `<entity>.getTag(<expr>)`

Method that gets the value of a given tag. The tag name (`<expr>`) may be any (string-typed) expression, and does not have to be a string literal. Evaluation (and validation) produces an error if `<entity>` is not an entity or if `<expr>` does not evaluate to a string.

For validation, `.getTag()` has the same relationship to `.hasTag()` as `.` has to `has`. See the notes on [`has`](#operator-has).

The `.getTag()` expression has a return type as specified by the `tags` declaration on the appropriate entity type in the [schema](../schema/schema.html#schema). If `.getTag()` is used on an entity type without a `tags` declaration, validation produces an error.

### `is` \(entity type test\) {#operator-is}

**Usage:** `<entity> is <entity-type>`

boolean operator that evaluates to `true` if the left operand is an entity that has the specified entity type and evaluates to `false` if the left operand is an entity that does not have the specified entity type. Evaluating (and validating) an `is` expression where the type of an expression that is not an entity results in an error. Validation can also fail if the RHS is not a known entity type (given in the schema).

Using `is` is helpful when knowing the type of an entity ensures that it has particular attributes or entity relationships. For example, suppose that for requests with action `Action::"view"`, the `principal` always has type `User`, but the `resource` could have type `Photo` or type `User`, and only entities of type `Photo` have an `owner` attribute. Then we might write the following policy.

```cedar
permit(principal, action == Action::"view", resource)
when {
  resource is Photo && resource.owner == principal
};
```
Because of short-circuiting of `&&`, we know that only if the `resource is Photo` sub-expression succeeds will we access `resource.owner`, so we can be confident the attribute is present.

**Usage:** `<entity> is <entity-type> in <entity>`

**Usage:** `<entity> is <entity-type> in set(<entity>)`

The `is` operator may optionally be combined with an `in` operation, in which case the expression is equivalent to `<entity> is <entity-type> && <entity> in <entity>` or `<entity> is <entity-type> && <entity> in set(<entity>)`.

#### Examples:
{: .no_toc }

Examples labeled with `//error` both fail to evaluate and fail to validate.

```cedar
User::"alice" is User                       //true
principal is User                           //true if `principal` has the `User` entity type
principal is User in Group::"friends"       //true if `principal` has the `User` entity type and is in `Group::"friends"`
ExampleCo::User::"alice" is ExampleCo::User //true
Group::"friends" is User                    //false
ExampleCo::User::"alice" is User            //false - `ExampleCo::User` and `User` are different entity types
"alice" is String                           //error - `is` applies only to entity types, not strings
```

#### Validation

Validating `is` expressions relies on information specified in the [schema](../schema/schema.html#schema) about what the possible entity types are, and what the `principal`, `resource`, and `context` types can be for particular actions. Suppose we have expression `principal is Admin`. It can have the following types:

- Type error if `Admin` is not declared as an entity type in the schema
- Type `True` if the schema says `principal` surely does have type `Admin`, which means the expression will always evaluate to `true`
- Type `False` if the schema says `principal` surely does _not_ have a `Admin`, which means that the expression will always evaluate to `false`

Recall that types `True` and `False` are used internally by the validator for expressions that definitely evaluate to `true` or `false`, respectively. They are used for simulating the evaluator's short-circuiting behavior for [`&&`](#operator-and) and [`||`](#operator-or).

It may seem strange that the validator always knows when an `is` expression will evaluate to `true` or `false`. This is because it always knows when an expression has an entity type, and when it does, what type it must have. In particular, when validating a particular policy, the validator makes sure the policy is valid for every possible principal, resource, and action entity type combination defined by the schema. Consider our example policy up above:

```cedar
permit(principal, action == Action::"view", resource)
when {
  resource is Photo && resource.owner == principal
};
```

Recall that for `Action::"view"` we said that `principal`s always have type `User`, but `resource`s could be either `Photo` or `User` entities. Thus, the validator first considers the case where `principal` has entity type `User` and `resource` has type `Photo`. In this case, the `resource is Photo` sub-expression has type `True`, so the validator also considers the `resource.owner == principal` sub-expression, which is valid since `Photo` entities have `owner` attributes of type `User`. The validator next considers the case where `principal` has entity type `User` and `resource` has type `User`. In this case, the `resource is Photo` sub-expression has type `False` (since a resource with `User` type is not a `Photo`), and thanks to short-circuiting the whole expression can be given type `False`.

### `.contains()` \(single element set membership test\) {#function-contains}

**Usage:** `<set>.contains(<value>)`

Function that evaluates to `true` if the operand is a member of the receiver on the left side of the function. The receiver must be of type `Set` or evaluation produces an error. To be accepted by the policy validator, `contains` must be called on a receiver that is a `Set` of some type _T_, with an argument that also has type _T_.

#### Examples:
{: .no_toc }

Examples labeled with `//error` both fail to evaluate and fail to validate. Examples that evaluate to a result may fail to validate.

```cedar
[1,2,3].contains(1)                             //Evaluates to true //Validates
[1,"something",2].contains(1)                   //Evaluates to true //Doesn't validate (heterogeneous set)
[1,"something",2].contains("Something")         //Evaluates to false (string comparison is case-sensitive) //Doesn't validate (heterogeneous set)
["some", "useful", "tags"].contains("useful")   //Evaluates to true //Validates
[].contains(100)                                //Evaluates to false // Doesn't validate (has empty-set literal)
context.role.contains("admin")                  //Evaluates to true (if the `context.role` set contains string "admin") //Validates
[User::"alice"].contains(principal)             //Evaluates to true (if principal == User::"alice") //Validates
"ham and ham".contains("ham")                   //error - 'contains' is not allowed on strings
```

A *heterogeneous set*, as shown in several examples, contains more than one type. None of the `validates: false` examples is a valid set. See [valid sets](syntax-datatypes.html#datatype-set) for more info.

### `.containsAll()` \(all element set membership test\) {#function-containsAll}

**Usage:** `<set>.containsAll(<set>)`

Function that evaluates to `true` if *every* member of the operand set is a member of the receiver set. Both the receiver and the operand must be of type `set` or evaluation results in an error. To be accepted by the validator, the receiver and argument to `containsAll` must be _homogeneous_ sets of the _same type_.

#### Examples:
{: .no_toc }

In the examples that follow, those labeled `//error` both evaluate and validate to an error. The remaining examples evaluate to a proper result, but some fail to validate, as indicated in the labels.

```cedar
[1, -22, 34].containsAll([-22, 1])                                //Evaluates to true //Validates
[1, -22, 34].containsAll([-22])                                   //Evaluates to true //Validates
[43, 34].containsAll([34, 43])                                    //Evaluates to true //Validates
[1, -2, 34].containsAll([1, -22])                                 //Evaluates to false //Validates
[1, 34].containsAll([1, 101, 34])                                 //Evaluates to false //Validates
[false, 3, [47, 0], "some"].containsAll([3, "some"])              //Evaluates to true //Doesn't validate (heterogeneous set)
[false, 3, [47, 0], {"2": "ham"}].containsAll([3, {"2": "ham"}])  //Evaluates to true //Doesn't validate (heterogeneous set)
[2, 43].containsAll([])                                           //Evaluates to true //Doesn't validate (emptyset literal)
[].containsAll([2, 43])                                           //Evaluates to false //Doesn't validate (emptyset literal)
[false, 3, [47, 0], "thing"].containsAll("thing")                 //error - operand a string
"ham and eggs".containsAll("ham")                                 //error - prefix and operand are strings
{"2": "ham", "3": "eggs "}.containsAll({"2": "ham"})              //error - prefix and operand are records
```
Some examples evaluate to a result but fail to validate for one or more of the following reasons:
- They operate on heterogeneous sets: values of multiple types
- They reference the empty-set literal `[]`
- They don't operate on sets at all.
See [valid sets](syntax-datatypes.html#datatype-set) for more info.

### `.containsAny()` \(any element set membership test\) {#function-containsAny}

**Usage:** `<set>.containsAny(<set>)`

Function that evaluates to `true` if *any one or more* members of the operand set is a member of the receiver set. Both the receiver and the operand must be of type `set` or evaluation produces an error. To be accepted by the policy validator, calls to `containsAny` must be on _homogeneous_ sets _of the same type_.

#### Examples:
{: .no_toc }

In the examples that follow, those labeled `//error` both evaluate and validate to an error. The remaining examples evaluate to a proper result, but some fail to validate, as indicated in the labels.

```cedar
[1, -22, 34].containsAny([1, -22])                             //Evaluates to true //Validates
[1, -22].containsAny([1, -22, 34])                             //Evaluates to true //Validates
[-22].containsAny([1, -22, 34])                                //Evaluates to true //Validates
[1, 101].containsAny([1, -22, 34])                             //Evaluates to true //Validates
[1, 101].containsAny([-22, 34])                                //Evaluates to false //Validates
["alice","bob","charlie"].containsAny(["david","bob","juan"])  //Evaluates to true //Validates
[].containsAny(["bob"])                                        //Evaluates to false //Doesn't validate (emptyset literal)
["bob"].containsAny([])                                        //Evaluates to false //Doesn't validate (emptyset literal)
"ham".containsAny("ham and eggs")                              //error - operand is a string
{"2": "ham"}.containsAny({"2": "ham", "3": "eggs "})           //error - prefix and operands are records
```

The examples that evaluate to a result but fail to validate reference the empty-set literal `[]`. See [valid sets](syntax-datatypes.html#datatype-set) for more info.

### `.isEmpty()` \(set emptiness test\) {#function-isEmpty}

**Usage:** `<set>.isEmpty()`

Function that evaluates to `true` if the set is empty.
The receiver must be of type `set` or evaluation produces an error.

#### Examples:
{: .no_toc }

```cedar
[1, -22, 34].isEmpty() // Evaluates to false
[].isEmpty() // Evaluates to true
"".isEmpty() // Error - operand is a string, not a set
```

## IP address functions {#functions-ipaddr}

Use these functions to test characteristics of IP addresses and ranges.

### `.isIpv4()` \(IPv4 address valid test\) {#function-isIpv4}

**Usage:** `<ipaddr>.isIpv4()`

Evaluates to `true` if the receiver is an IPv4 address; evaluates (and validates) to an error if receiver does not have `ipaddr` type. This function takes no operand.

#### Examples:
{: .no_toc }

In the examples that follow, those labeled `//error` both evaluate and validate to an error.

```cedar
ip("127.0.0.1").isIpv4()     //true
ip("::1").isIpv4()           //false
ip("127.0.0.1/24").isIpv4()  //true
context.foo.isIpv4()         //error if `context.foo` is not an `ipaddr`
```

### `.isIpv6()` \(IPv6 address valid test\) {#function-isIpv6.title}

**Usage:** `<ipaddr>.isIpv6()`

Function that evaluates to `true` if the receiver is an IPv6 address; evaluates (and validates) to an error if received does not have `ipaddr` type. This function takes no operand.

#### Examples:
{: .no_toc }

In the examples that follow, those labeled `//error` both evaluate and validate to an error.

```cedar
ip("127.0.0.1/24").isIpv6()  //false
ip("ffee::/64").isIpv6()     //true
ip("::1").isIpv6()           //true
context.foo.isIpv6()         //error if `context.foo` is not an `ipaddr`
```

### `.isLoopback()` \(test for IP loopback address\) {#function-isLoopback.title}

**Usage:** `<ipaddr>.isLoopback()`

Function that evaluates to `true` if the receiver is a valid loopback address for its IP version type; evaluates (and validates) to an error if receiver does not have `ipaddr` type. This function takes no operand.

#### Examples:
{: .no_toc }

In the examples that follow, those labeled `//error` both evaluate and validate to an error.

```cedar
ip("127.0.0.2").isLoopback()  //true
ip("::1").isLoopback()        //true
ip("::2").isLoopback()        //false
context.foo.isLoopback()      //error if `context.foo` is not an `ipaddr`
```

### `.isMulticast()` \(test for multicast address\) {#function-isMulticast.title}

**Usage:** `<ipaddr>.isMulticast()`

Function that evaluates to `true` if the receiver is a multicast address for its IP version type; evaluates (and validates) to an error if receiver does not have `ipaddr` type. This function takes no operand.

#### Examples:
{: .no_toc }

In the examples that follow, those labeled `//error` both evaluate and validate to an error.

```cedar
ip("127.0.0.1").isMulticast()  //false
ip("ff00::2").isMulticast()    //true
context.foo.isMulticast()      //error if `context.foo` is not an `ipaddr`
```

### `.isInRange()` \(test for inclusion in IP address range\) {#function-isInRange.title}

**Usage:** `<ipaddr>.isInRange(<ipaddr>)`

Function that evaluates to `true` if the receiver is an IP address or a range of addresses that fall completely within the range specified by the operand. This function evaluates (and validates) to an error if either operand does not have `ipaddr` type.

#### Examples:
{: .no_toc }

In the examples that follow, those labeled `//error` both evaluate and validate to an error.

```cedar
ip("192.168.0.1").isInRange(ip("192.168.0.1/24"))   //true
ip("192.168.0.1").isInRange(ip("192.168.0.1/28"))   //true
ip("192.168.0.75").isInRange(ip("192.168.0.1/24"))  //true
ip("192.168.0.75").isInRange(ip("192.168.0.1/28"))  //false
ip("1:2:3:4::").isInRange(ip("1:2:3:4::/48"))       //true
ip("192.168.0.1").isInRange(ip("1:2:3:4::"))        //false
ip("192.168.0.1").isInRange(1)                      //error - operand is not an ipaddr
context.foo.isInRange(ip("192.168.0.1/24"))         //error if `context.foo` is not an `ipaddr`
```

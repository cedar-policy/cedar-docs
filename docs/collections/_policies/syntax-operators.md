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

When giving examples below, we will highlight restrictions on the form of expressions that allows them to properly validate.

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
  // inverse of the value of the Boolean operand
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

#### Examples:
{: .no_toc }

```cedar
decimal("1.0")
decimal("-1.0")
decimal("123.456")
decimal("0.1234")
decimal("-0.0123")
decimal("55.1")
decimal("00.000")
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

Cedar can properly evaluate `decimal(e)` where `e` is any Cedar expression that evaluates to a legal string. For example, the expression `decimal(if true then "1.1" else "2.1")` will evaluate to the decimal number `1.1`. However, Cedar's [policy validator](validation.html#validation) only permits `e` to be a _string literal_ that will not result in an error or overflow. So, all of the above examples are also accepted by the validator except those commented as `//error`.

### `ip()` \(parse string and convert to ipaddr\) {#function-ip}

**Usage:** `ip(<string>)`

Function that parses the string and attempts to convert it to type `ipaddr`. If the string doesn't represent a valid IP address or range, then the `ip()` expression generates an error when evaluated.

```cedar
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
ip([127,0,0,1])                     //error – invalid operand type
"127.0.0.1".ip()                    //error – invalid call style

ip("127.0.0.1") == ip("127.0.0.1")            //true
ip("192.168.0.1") == ip("8.8.8.8")            //false
ip("192.168.0.1/24") == ip("8.8.8.8/8")       //false
ip("192.168.0.1/24") == ip("192.168.0.8/24")  //false - different host address
ip("127.0.0.1") == ip("::1")                  //false – different IP versions
ip("127.0.0.1") == ip("192.168.0.1/24")       //false - address compared to range
ip("127.0.0.1") == "127.0.0.1"                //false – different types
ip("::1") == 1                                //false – different types
```

Cedar can properly evaluate `ip(e)` where `e` is any Cedar expression that evaluates to a legal string. For example, the expression `ip(if true then "1.1.1.1/24" else "2.1.1.1/32")` will evaluate to the IP address `1.1.1.1/24`. However, Cedar's [policy validator](validation.html#validation) only permits `e` to be a _string literal_ that will not result in an error. So, all of the above examples are also validatable except those commented as `//error` as well as the last two, as `==` expressions do not validate when applied to expressions of different types (see the [discussion of `==`](#operator-equality) below).

## Comparison operators and functions {#operators-comparison}

Use these operators to compare two values. An expression that uses one of these operators evaluates to a Boolean `true` or `false`. You can then combine multiple expressions using the logical operators.

### `==` \(equality\) {#operator-equality}

**Usage:** `<any type> == <any type>`

Binary operator that compares two operands of any type and evaluates to `true` only if they are exactly the same type and the same value. If the operands are of different types, the result is always `false`.

#### Examples:
{: .no_toc }

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
User::"alice" == Admin::"alice" //false -- entities of two different types
5 == "5"                        //false -- operands have two different types
"alice" == User::"alice"        //false -- operands have two different types
```

While Cedar can _evaluate_ policies that check the equality of two values of different types, such comparison expressions are not accepted by the policy validator. In particular, policies containing equality expressions `e1 == e2` are only validated when

1. Both `e1` and `e2` have the same type, or
2. Both have entity type, though that type need not be the same

This means that all of the above examples are deemed valid except the last two, which compare values of different types. The third-from-last is valid because it is comparing two entities (albeit of different types).

### `!=` \(inequality\) {#operator-inequality}

**Usage:** `<any type> != <any type>`

Binary operator that compares two operands of any type and evaluates to `true` if the operands have different values or are of different types. You can use `!=` ***only*** in `when` and `unless` clauses.

#### Example:
{: .no_toc }

```cedar
forbid (principal, action, resource)
when{
    resource.tag != "public"
};
```

As with the `==` operator, to be accepted by the policy validator a policy can only use `!=` on two expressions of (possibly differing) entity type, or the same non-entity type.

### `<` \(Long integer 'less than'\) {#operator-lessthan}

**Usage:** `<Long> < <Long>`

Binary operator that compares two `Long` integer operands and evaluates to `true` if the left operand is numerically less than the right operand.

#### Examples:
{: .no_toc }

```cedar
3 < 303               //true
principal.age < 22    //true (assuming principal.age is 21)
3 < "3"               //error - operator not allowed on non-Long
false < true          //error - operator not allowed on non-Long
"" < "zzz"            //error - operator not allowed on non-Long
[1, 2] < [47, 0]      //error - operator not allowed on non-Long
```

As shown in the examples, evaluating an expression with `<` when the operators are not both `Long` numbers results in an error. The policy validator rejects also any expression that attempts to compare two values with `<` that do not have type `Long`; so, all of the expressions above with comment `//error` would be rejected by the validator.

### `.lessThan()` \(decimal 'less than'\) {#function-lessThan}

**Usage:** `<decimal>.lessThan(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically less than the right operand.

#### Examples:
{: .no_toc }

```cedar
decimal("1.23").lessThan(decimal("1.24"))     //true
decimal("1.23").lessThan(decimal("1.23"))     //false
decimal("123.45").lessThan(decimal("1.23"))   //false
decimal("-1.23").lessThan(decimal("1.23"))    //true
decimal("-1.23").lessThan(decimal("-1.24"))   //false
decimal("1.1").lessThan(2)                    //error -- not a decimal operand
ip("1.1.2.3").lessThan(decimal("1.2"))        //error -- not a decimal operand
```

The `lessThan` function must take two `decimal` operands or else it will produce an error when evaluated, per the last two examples. Likewise, to be valid, a policy with a `lessThan` expression must operate on two `decimal`s; thus the validator will reject the last two examples.

### `<=` \(Long integer 'less than or equal'\) {#operator-lessthanorequal}

**Usage:** `<Long> <= <Long>`

Binary operator that compares two `Long` integer operands and evaluates to `true` if the left operand is numerically less than or equal to the right operand.

#### Examples:
{: .no_toc }

```cedar
3 <= 303               //true
principal.age <= 21    //true (assuming principal.age is 21)
3 <= "3"               //error - operator not allowed on non-Long
false <= true          //error - operator not allowed on non-Long
"" <= "zzz"            //error - operator not allowed on non-Long
[1, 2] <= [47, 0]      //error - operator not allowed on non-Long
```

As shown in the examples, evaluating an expression with `<=` when the operators are not both `Long` numbers results in an error. The policy validator also rejects any expression that attempts to compare two values with `<=` that do not have type `Long`.

### `.lessThanOrEqual()` \(decimal 'less than or equal'\) {#function-lessThanOrEqual}

**Usage:** `<decimal>.lessThanOrEqual(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically less than or equal to the right operand.

#### Examples:
{: .no_toc }

```cedar
decimal("1.23").lessThanOrEqual(decimal("1.24"))    //true
decimal("1.23").lessThanOrEqual(decimal("1.23"))    //true
decimal("123.45").lessThanOrEqual(decimal("1.23"))  //false
decimal("-1.23").lessThanOrEqual(decimal("1.23"))   //true
decimal("-1.23").lessThanOrEqual(decimal("-1.24"))  //false
decimal("1.1").lessThanOrEqual(2)                   //error -- not a decimal operand
ip("1.1.2.3").lessThanOrEqual(decimal("1.2"))       //error -- not a decimal operand
```

The `lessThanOrEqual` function must take two `decimal` operands or else it will produce an error when evaluated, per the last two examples. The policy validator also rejects also any expression that attempts to call `lessThanOrEqual` on non-`decimal` values.

### `>` \(Long integer 'greater than'\) {#operator-greaterthan}

**Usage:** `<Long> > <Long>`

Binary operator that compares two `Long` integer operands and evaluates to `true` if the left operand is numerically greater than the right operand.

#### Examples:
{: .no_toc }

```cedar
3 > 303                //false
principal.age > 22     //false (assuming principal.age is 21)
3 > "3"                //error - operand is a non-Long
false > true           //error - operands are not Long integers
"some" > "thing"       //error - operands are not Long integers
```

As shown in the examples, evaluating an expression with `>` when the operators are not both `Long` numbers results in an error. The policy validator also rejects also any expression that attempts to compare two values with `>` that do not have type `Long`.

### `.greaterThan()` \(decimal 'greater than'\) {#function-greaterThan}

**Usage:** `<decimal>.greaterThan(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically greater than the right operand.

#### Examples:
{: .no_toc }

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

### `>=` \(Long integer 'greater than or equals'\) {#operator-greaterthanorequal}

**Usage:** `<Long> >= <Long>`

Binary operator that compares two `Long` integer operands and evaluates to `true` if the left operand is numerically greater than or equal to the right operand.

#### Examples:
{: .no_toc }

```cedar
3 >= 303               //false
principal.age >= 21    //true (assuming principal.age is 21)
3 >= "3"               //error - operand is a non-Long
false >= true          //error - operands are not Long integers
"some" >= "thing"      //error - operands are not Long integers
```
As shown in the examples, evaluating an expression with `>=` when the operators are not both `Long` numbers results in an error. The policy validator also rejects also any expression that attempts to compare two values with `>=` that do not have type `Long`.

### `.greaterThanOrEqual()` \(decimal 'greater than or equal'\) {#function-greaterThanOrEqual}

**Usage:** `<decimal>.greaterThanOrEqual(<decimal>)`

Function that compares two decimal operands and evaluates to `true` if the left operand is numerically greater than or equal to the right operand.

#### Examples:
{: .no_toc }

```cedar
decimal("1.23").greaterThanOrEqual(decimal("1.24"))    //false
decimal("1.23").greaterThanOrEqual(decimal("1.23"))    //true
decimal("123.45").greaterThanOrEqual(decimal("1.23"))  //true
decimal("-1.23").greaterThanOrEqual(decimal("1.23"))   //false
decimal("-1.23").greaterThanOrEqual(decimal("-1.24"))  //true
```
The `greaterThanOrEqual` function must take two `decimal` operands or else it will produce an error when evaluated, per the last two examples. The policy validator also rejects also any expression that attempts to call `greaterThanOrEqual` on non-`decimal` values.

## Logical operators {#operators-logical}

Use these operators on Boolean values or expressions.

### `&&` \(AND\) {#operator-and}

**Usage:** `<Boolean> && <Boolean>`

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

#### More Examples:
{: .no_toc }

```cedar
3 && false          //error -- first operand is not a Boolean
false && 3          //false (due to short circuiting)
(3 == 4) && 3       //false (due to short circuiting)
(User::"alice" == Action::"viewPhoto") && 3 //false
true && 3           //error -- second operand is not a Boolean
(false && 3) == 3   //false
```
- The first example evaluates to an error because the first operand is a non-`Boolean`.
- The second example evaluates to `false` because of short-circuiting: even though the second operand is a non-`Boolean`, we never reach it because the first operand is `false`, so evaluation stops there.
- In the third example we have replaced `false` with `(3 == 4)`, which will evaluate to `false`, and thereby short-circuit the `&&`.
- The fourth example is similar, but we compare two different entities, rather than two different numbers.
- The fifth example is similar to the second, but does not short-circuit because the first operand is `true`, so we must consider the second operand to evaluate the whole expression.
- The last example is also similar to the second: Short-circuiting applies within the `(false && 3)` subexpression, which evaluates to `false`, yielding expression `false == 3` which also evaluates to `false`.

The description of the above examples is from the perspective of _evaluation_. From the perspective of policy _validation_, the situation is a little different. In general, the validator will reject any expression `e1 && e2` that would evaluate to an error due to either `e1` or `e2` not having `Boolean` type, i.e., the first and fourth examples above.

The validator _sometimes_ is able to take short-circuiting into account. It will accept `false && 3` (second example) and `(User::"alice" == Action::"viewPhoto") && 3` (fourth example), but not `(3 == 4) && 3` (third example). The reason is that it knows `false` is always, well, `false`, so it can model short-circuiting. It also knows that comparing two entities with different types will always evaluate to to `false`. Internally, the validator has a type `False` for expressions that  surely evaluate to `false`, and also a type `True` for those that surely evaluate to `true`. So, `false` has type `False`, as does `(User::"alice" == Action::"viewPhoto")`. And so does expression `e1 && e2` when `e1` has type `False`. However, expression `3 == 4` has type `Boolean` (the validator does not look at the values of the literals), so the validator will not short-circuit when considering `(3 == 4) && e2` -- it will require that `e2` has type `Boolean` (or `True` or `False`).

### `||` \(OR\) {#operator-or}

**Usage:** `<Boolean> || <Boolean>`

Binary operator that evaluates to `true` if the first operand evaluates to `true`, or the first evaluates to `false` and the second operand evaluates to `true`. Evaluates to `false` if both operands evaluate to `false`.

This operator uses [short circuit evaluation](https://wikipedia.org/wiki/Short-circuit_evaluation). If the first argument is `true`, then the expression immediately evaluates to `true` and the second argument isn't evaluated. This approach is useful when the second argument might result in an error if evaluated. The first argument should be a test that can determine if the second argument is safe to evaluate. For example, consider the following expression. It evaluates to `true` if the principal is either missing the `age` attribute or that attribute is at least 21.

```cedar
!(principal has age) || principal.age < 21 
```

The second comparison in this expression will evaluate to a Boolean only if the `age` attribute for the `principal` entity is present. If it is missing, then `principal.age` will evaluate to an error. The first expression uses the [`has`](#operator-has) operator, inverted by the `!` **[NOT](#operator-not)** operator, to flag that the `principal` entity is missing the `age` property. If that evaluates to `true`, there is no test of the second expression.

The following policy allows if either `resource.owner == principal` or `resource.tag == "public"` is true.

```cedar
permit (principal, action == Action:"read", resource)
when {
    resource.owner == principal ||
    resource.tag == "public"
};
```

#### More Examples:
{: .no_toc }

```cedar
3 || true                  //error (first operand not a Boolean)
true || 3                  //true (due to short-circuiting)
false || 3                 //error (second operand not a Boolean)
(3 == 3) || 3              //true (due to short-circuiting)
```

The first example evaluates to an error because the first operand is not a Boolean. The second example evaluates to `true` because of short-circuiting: We never consider the second operand once we see the first operand evaluates to `true`. The third example evaluates to an error because the second operand is not a Boolean -- we evaluate it because the first (Boolean) operand does not evaluate to `true`. The fourth example is similar to the second but has `(3 == 3)`, which _evaluates_ to `true` rather than being `true` itself, for the first operand.

The description of the above examples is from the perspective of _evaluation_. From the perspective of policy _validation_, the situation is a little different. In general, the validator will reject any expression `e1 || e2` that would evaluate to an error due to either `e1` or `e2` not having `Boolean` type, i.e., the first and third examples above. The validator _sometimes_ is able to take short-circuiting into account. It will accept `true || 3` (second example) but not `(3 == 3) && 3` (fourth example). As discussed for [`&&`](#operator-and), the validator has an internal type `True` for expressions that surely evaluate to `true`, and similarly for `False`, and it uses these types to implement a short-circuiting semantics for `&&` and `||`. Here,m the expression `3 == 3` has type `Boolean` (the validator does not look at the values of the literals), so the validator will not short-circuit when considering `(3 == 3) && e2` -- it will require that `e2` has type `Boolean` (or `True` or `False`).

### `!` \(NOT\) {#operator-not}

**Usage:** `! <Boolean>`

Unary operator with only one argument. It inverts the value of the Boolean operand from `true` to `false`, or from `false` to `true`.

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

```cedar
! true                                //false
! false                               //true
! 8                                   //error
if !true then "hello" else "goodbye"  //"goodbye"
```

### `if` \(CONDITIONAL\) {#operator-if}

**Usage:** `if <Boolean> then <T> else <U>`

The `if` operator returns its evaluated second argument if the first argument evaluates to `true`, else it returns the evaluated third argument.

The `if` operator requires its first argument to be a boolean, i.e., to evaluate to either `true` or `false`. If it does not, the `if` evaluates to an error. The second and third arguments can have any type; to be compatible with [validation](validation.,html), both arguments must have the _same_ type (though see below).

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

The `if` operator is a strict generalization of the `&&` and `||` operators. The expression _e1_ `||` _e2_ is equivalent to the expression `if` _e1_ `then` `true` `else` (`if` _e2_ `then` `true` `else` `false`). The expression _e1_ `&&` _e2_ is equivalent to the expression `if` _e1_ `then` (`if` _e2_ `then` `true` `else` `false`) `else` `false`. Note that _e1_ `||` _e2_ is _not_ equivalent to `if` _e1_ `then` `true` `else` _e2_, due to the possibility of type errors. To see why, consider that `false` `||` `"foo"` produces a type error, while `if false then true else "foo"` evaluates to `"foo"`.

Note that `if` and `when`, though similar in normal English, play different roles in Cedar. The keyword `when` is part of the _policy syntax_ which simply connects the policy scope to the policy's condition(s). The keyword `if` is a part of an _expression_ that can be contained in such a condition, and can be evaluated against a relevant authorization request.

#### More Examples:
{: .no_toc }

```cedar
if 1 == 1 then "ok" else "wrong"         //"ok"
if 1 == 2 then User::"foo" else "ok"     //"ok"
if 1 then "wrong" else "wrong"           //error
if false then (1 && "hello") else "ok"   //"ok" (due to short circuiting)
if true then (1 && "hello") else "ok"    //error
```
Notice that the fourth example does not evaluate to an error because it short-circuits evaluation of the second argument.

From the perspective of _validation_, the validator will accept the first and fourth examples, but reject the second, third, and fifth. The first example is valid because the first operand `1 == 1` has `Boolean` type, and both the second and third operands have the same type (`String`). The second example is rejected because the second and third operands do not have the same type. The third example is rejected because first operand `1` does not have type `Boolean`. The fourth example is _accepted_ because the validator is able to consider short-circuiting: It knows that because the first operand is `false` that the second operand _must_ be skipped. It does this by giving `false` the internal type `False` as described for operators [`&&`](#operator-and) and [`||`](#operator-or). Note that it is not able to give the expression `1 == 2` type `False` in the second example; if it was, then this example would be accepted despite the last two operands not having the same type.

## Arithmetic operators {#operators-math}

Use these operators to perform arithmetic operations on `Long` integer values.

**Notes**  
The arithmetic operators support ***only*** values of type `Long`. They don't support values of type `Decimal`.
There is no operator for arithmetic division.

{: .warning }
>If you exceed the range available for the `Long` data type by using any of the arithmetic operators, it results in an overflow error. In general, a policy that results in an error is ignored, meaning that a `permit` policy might unexpectedly fail to allow access, or a `forbid` policy might unexpectedly fail to block access.

### `+` \(Numeric addition\) {#operator-add}

**Usage:** `<Long> + <Long>`

Binary operator that adds the two `Long` integer values and returns a `Long` integer sum; could result in an overflow error.

#### Example:
{: .no_toc }

The following policy returns `allow` if the context `budget` minus the context `downloaded` is greater than 100.

```cedar
permit (principal, action, resource)
when {
    context.budget - context.downloaded > 100
};
```

#### Other examples:
{: .no_toc }

```cedar
11 + 0                              //11
-1 + 1                              //0
9223372036854775807 + 1             //error - overflow
7 + "3"                             //error - second operand not a Long
"lamp" + "la"                       //error - operands not `Long`
```

During policy validation, the validator will reject `+` expressions where either of the two operands is not a `Long`; so the last two examples are rejected by the validator. However, the validator does not attempt to detect possible integer overflow, so it does not reject the third example.

### `-` \(Numeric subtraction or negation\) {#operator-subtract}

**Usage:** `<Long> - <Long>` or `- <Long>`

As a binary operator with two operands, it subtracts the second `Long` integer value from the first and returns a `Long` integer difference.

#### Examples:
{: .no_toc }

```cedar
-3                              //-3
44 - 31                         //13
5 - (-3)                        //8
-9223372036854775807 - 2 + 3    //error - overflow
7 - "3"                         //error - second operand not a `Long`
```

Since the `-` symbol can mean both unary and binary subtraction, the third example must use parentheses to disambiguate.

During policy validation, the validator will reject `-` expressions where either of the two operands is not a `Long`; so the last example is rejected by the validator. However, the validator does not attempt to detect possible integer overflow, so it does not reject the fourth example.

### `*` \(Numeric multiplication\) {#operator-multiply}

**Usage:** `<Long> * <Long>`

Binary operator that multiplies two `Long` integer operands and returns a `Long` integer product. One of the operands ***must*** be an literal, the other value can be a literal or a general expression or else the expression is [rejected by the parser](syntax-grammar.html#grammar-mult).

{: .note }
>There is no operator for arithmetic division.

#### Examples:
{: .no_toc }

In these examples, suppose that `resource.value` is 3 and `context.budget` is 4.

```cedar
10 * 20                          //200
resource.value * 10              //30
2 * context.budget > 100         //false
context.budget * resource.value  //will not parse - one operand must be a literal
9223372036854775807 * 2          //error - overflow
5 * (-3)                         //-15
5 * 0                            //0
"5" * 0                          //error - both operands must have type `Long`
```

The fourth example is rejected by the policy _parser_ -- it is not acceptable according to the Cedar grammar. The fifth example is accepted by the validator, which does not attempt to predict possible overflow. The last example will be rejected by the policy validator since the first operand is not a `Long`.

## Hierarchy and set membership operators and functions {#functions-set}

Use these functions to test if entities are members of a hierarchy or a set.

### `in` \(Hierarchy membership\) {#operator-in}

**Usage:** `<entity> in <entity>`

Binary operator that evaluates to `true` if the entity in the left operand is a descendant in the hierarchy under the entity in the right operand.

The `in` operator is transitive. If `A` is in `B`, and `B` is in `C`, then `A` is also in `C`. This approach allows you to model the concept of a multi-tier hierarchy, for example nesting folders in other folders.

The `in` operator is reflexive. The expression evaluates to `true` if the right entity is the same as the left entity. In other words, an entity is *always* in its own hierarchy. `A` is always in `A`.

#### Examples:
{: .no_toc }

In these examples, assume that the `principal` in a request is `User::"bob"`, and that `User::"bob"` has `Group::"janefriends"` as a parent in the hierarchy, which in turn has `Group::"all"` as a parent.

```cedar
principal in User::"bob"             //true by reflexivity
principal in Group::"janefriends"    //true
Group::"janefriends" in Group::"all" //true
principal in Group::"all"            //true by transitivity
Group::"all" in User::"bob"          //false -- in is not symmetric
1 in Group::"janefriends"            //error -- LHS not an entity
```

When validating an expression, the validator confirms that the first (lhs) operand of `in` is always an entity, and the (rhs) is as well, or else is a set of entities (see below).

**Usage:** `<entity> in set(<entity>)`

When the right operand is a _set_ of entities, then the expression evaluates to `true` if the left operand is `in` any of the entities in the set. For example, consider the following expression.

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

evalautes to an error (since `1` is not an entity).

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

Because the in operator is reflexive, A `in`` A returns true even if the entity A does not exist in the `entities` passed in with the request. The evaluator treats entity references that are not in the hierarchy as a valid entity. For example:

```cedar
Stranger::"jimmy" in Stranger::"jimmy"        // true by reflexivity.
Stranger::"jimmy" in Group::"jane_friends"    // false - Stranger::"jimmy" does not refer to an existing entity
Stranger::"jimmy" in [
    Group::"jane_family",
    Stranger::"jimmy"
]                                             // true - Stranger::"jimmy" in Stranger::"jimmy" is true
```

#### More Examples:
{: .no_toc }

```cedar
"some" in ["some", "thing"] //error - these are strings, not entities. For strings, use `contains` for set membership.
"os" in {"os":"Windows "}   //error - use `has` operator to check if a key exists
```

To validate a policy with an `in` expression `e1 in e2`, the validator will confirm that the left operand `e1` is an entity type, and `e2` is either an entity type or a set of entities (all of which have the same type).

### `has` \(presence of attribute test\) {#operator-has}

**Usage:** `<entity> has <attribute>`

Boolean operator that evaluates to `true` if the left operand has a value defined for the specified attribute. Use this operator to check that a value is present before accessing that value. If an expression accesses an attribute that isn't present, then evaluation produces an error.

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

- Type `Boolean` if the schema says `context` has a `role` attribute which is not required, i.e., it's optional
- Type `True` if the schema says `context` has a `role` attribute which _is_ required, which means the expression will always evaluate to `true`
- Type `False` if the schema says `context` does not have a `role` attribute, which means that the expression will always evaluate to `false`

Recall that types `True` and `False` are used internally by the validator for simulating the evaluator's short-circuiting behavior for [`&&`](#operator-and) and [`||`](#operator-or).

The validator will reject any `has` expression whose left-hand operand is not an expression whose type is an entity or record.

### `is` \(entity type test\) {#operator-is}

**Usage:** `<entity> is <entity-type>`

Boolean operator that evaluates to `true` if the left operand is an entity that has the specified entity type and evaluates to `false` if the left operand is an entity that does not have the specified entity type.
Evaluating an `is` expression where the type of an expression that is not an entity results in an error.

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

Function that evaluates to `true` if the operand is a member of the receiver on the left side of the function. The receiver must be of type `Set`.

#### Examples:
{: .no_toc }

```cedar
[1,2,3].contains(1)                             //true
[1,"something",2].contains(1)                   //true
[1,"something",2].contains("Something")         //false - string comparison is case-sensitive
["some", "useful", "tags"].contains("useful")   //true
[].contains(100)                                //false
context.role.contains("admin")                  //true if the `context.role` set contains string "admin"
[User::"alice"].contains(principal)             //true if principal == User::"alice"
"ham and ham".contains("ham")                   // error - 'contains' is not allowed on strings
```

To be accepted by the policy validator, the `contains` function must be called on a receiver that is a `Set` of some type _T_, with an argument that also has type _T_. The second, third, fifth, and eighth examples above would not validate. The second and third operate on a set that contains values of multiple types rather than a single type, the fifth operates on the empty set literal; none of these is a valid set (see discussion of [valid sets](syntax-datatypes.html#datatype-set) for more info). The eighth example is invalid because it does not operate on a set at all.

### `.containsAll()` \(all element set membership test\) {#function-containsAll}

**Usage:** `<set>.containsAll(<set>)`

Function that evaluates to `true` if *every* member of the operand set is a member of the receiver set. Both the receiver and the operand must be of type `set`. To be accepted by the validator, the receiver and argument to `containsAll` must be homogeneous sets of the same type.

```cedar
[1, -22, 34].containsAll([-22, 1])                           // true
[1, -22, 34].containsAll([-22])                              // true
[43, 34].containsAll([34, 43])                               // true
[1, -2, 34].containsAll([1, -22])                            // false
[1, 34].containsAll([1, 101, 34])                            // false
[false, 3, [47, 0], "some"].containsAll([3, "some"])         // true
[false, 3, [47, 0], {"2": "ham"}].containsAll([3, {"2": "ham"}])  // true
[2, 43].containsAll([])                                      // true
[].containsAll([2, 43])                                      // false
[false, 3, [47, 0], "thing"].containsAll("thing")            // type error - operand a string
"ham and eggs".containsAll("ham")                            // type error - prefix and operand are strings
{"2": "ham", "3": "eggs "}.containsAll({"2": "ham"})         // type error - prefix and operand are records
```
The first five examples would validate, since in all cases the receiver and argument are sets of `Long` integers. The remaining examples would not validate because they either (a) operate on heterogeneous sets (of values of multiple types) and/or (b) reference the empty-set literal `[]`, or (c) do not operate on sets at all. Please see discussion of [valid sets](syntax-datatypes.html#datatype-set) for more information on validity rules for sets.

### `.containsAny()` \(any element set membership test\) {#function-containsAny}

**Usage:** `<set>.containsAny(<set>)`

Function that evaluates to `true` if *any one or more* members of the operand set is a member of the receiver set. Both the receiver and the operand must be of type `set`. To be accepted by the policy validator, calls to `containsAny` must be on _homogeneous_ sets _of the same type_.

```cedar
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

The first six examples would validate, since in all cases the receiver and argument are sets of `Long` integers, or `String`s. The remaining examples would not validate because they either (a) operate on heterogeneous sets (of values of multiple types) and/or (b) reference the empty-set literal `[]`, or (c) do not operate on sets at all. Please see discussion of [valid sets](syntax-datatypes.html#datatype-set) for more information on validity rules for sets.

## IP address functions {#functions-ipaddr}

Use these functions to test characteristics of IP addresses and ranges.

### `.isIpv4()` \(IPv4 address valid test\) {#function-isIpv4}

**Usage:** `<ipaddr>.isIpv4()`

Evaluates to `true` if the receiver is an IPv4 address. This function takes no operand. 

```cedar
ip("127.0.0.1").isIpv4()     //true
ip("::1").isIpv4()           //false
ip("127.0.0.1/24").isIpv4()  //true
context.foo.isIpv4()         //error if `context.foo` is not an `ipaddr`
```

### `.isIpv6()` \(IPv6 address valid test\) {#function-isIpv6.title}

**Usage:** `<ipaddr>.isIpv6()`

Function that evaluates to `true` if the receiver is an IPv6 address. This function takes no operand.

```cedar
ip("127.0.0.1/24").isIpv6()  //false
ip("ffee::/64").isIpv6()     //true
ip("::1").isIpv6()           //true
context.foo.isIpv6()         //error if `context.foo` is not an `ipaddr`
```

### `.isLoopback()` \(test for IP loopback address\) {#function-isLoopback.title}

**Usage:** `<ipaddr>.isLoopback()`

Function that evaluates to `true` if the receiver is a valid loopback address for its IP version type. This function takes no operand.

```cedar
ip("127.0.0.2").isLoopback()  //true
ip("::1").isLoopback()        //true
ip("::2").isLoopback()        //false
context.foo.isLoopback()      //error if `context.foo` is not an `ipaddr`
```

### `.isMulticast()` \(test for multicast address\) {#function-isMulticast.title}

**Usage:** `<ipaddr>.isMulticast()`

Function that evaluates to `true` if the receiver is a multicast address for its IP version type. This function takes no operand.

```cedar
ip("127.0.0.1").isMulticast()  //false
ip("ff00::2").isMulticast()    //true
context.foo.isMulticast()      //error if `context.foo` is not an `ipaddr`
```

### `.isInRange()` \(test for inclusion in IP address range\) {#function-isInRange.title}

**Usage:** `<ipaddr>.isInRange(<ipaddr>)`

Function that evaluates to `true` if the receiver is an IP address or a range of addresses that fall completely within the range specified by the operand.

```cedar
ip("192.168.0.1").isInRange(ip("192.168.0.1/24"))   //true
ip("192.168.0.1").isInRange(ip("192.168.0.1/28"))   //true
ip("192.168.0.75").isInRange(ip("192.168.0.1/24"))  //true
ip("192.168.0.75").isInRange(ip("192.168.0.1/28"))  //false
ip("1:2:3:4::/48").isInRange(ip("1:2:3:4::"))       //true
ip("192.168.0.1").isInRange(ip("1:2:3:4::"))        //false
ip("192.168.0.1").isInRange(1)                      //error - operand is not an ipaddr
context.foo.isInRange(ip("192.168.0.1/24"))         //error if `context.foo` is not an `ipaddr`
```

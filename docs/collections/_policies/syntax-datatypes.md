---
layout: default
title: Data types
nav_order: 3
---

# Data types supported by Cedar {#syntax-datatypes}
{: .no_toc }

The Cedar policy language supports values and expressions of several possible data types.

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Boolean {#datatype-boolean}

A value that is either `true` or `false`.

## String {#datatype-string}

A sequence of characters consisting of letters, numbers, or symbols.

Cedar doesn't have a string length limit, but services that use Cedar are likely to have limits for each element with a value of type `String`.

## Long {#datatype-long}

A whole number without decimals that can range from -9223372036854775808 to 9223372036854775807.

{: .warning }
>If you exceed the range available for the Long data type by using the [arithmetic operators](syntax-operators.html#arithmetic-operators), it results in an overflow error. A policy that results in an error is ignored, meaning that a Permit policy might unexpectedly fail to allow access, or a Forbid policy might unexpectedly fail to block access.

## Set {#datatype-set}

A collection of elements that can be of the same or different types. A set is constructed using bracket characters `[ ]` and separating the elements with commas. Here are a few examples of sets.

```cedar
// a set of three elements, two of type long, and one of type string
[2, 4, "hello"]

// a set of a single type long
[-1]

// an empty set
[ ]

// a set with a Boolean expression, a nested set, and a Boolean value
[3<5, ["nested", "set"], true]
```

While all of the above sets can be _evaluated_ successfully, not all of them can be _validated_. In particular, Cedar's [policy validator](validation.html#validation) may flag some expressions as being type incorrect even though they can evaluate during an authorization request successfully (as is typical of most programming language type systems). For sets, the policy validator will only accept set literals in policies if (1) the set is non-empty, and (2) all of its elements have the same type. Thus, _only_ the second out of the above four sets can be validated in Cedar. Note that empty sets can appear in entities and/or the `context` record; the only restriction is their appearance as a literal in a Cedar policy.


## Record {#datatype-record}

A collection of *attributes*. Each attribute consists of a name and an associated value. Names are simple strings. Values can be of any type. You can access an attribute's value by referencing its name as an index using either of the following syntax options:

+ `record["attributename"]`
+ `record.attributename`

The following example shows the correct syntax for a `Record`.

```json
{"key": "some value", id: "another value" }
```

You can reference the first attribute as either `record["key"]` or `record.key`. Both options evaluate to `"some value"`.

Records can also be nested. To access them use any of the following options:

+ All using `[]` – `record["some"]["nested"]["attribute"]`
+ All using `.` – `record.some.nested.attribute`
+ A mix of both – `record["some"].nested["attribute"]`

The following are additional examples of records.

```json
{}
{"foo": 2, bar: [3, 4, -47], ham: "eggs", "hello": true }
```

## Entity {#datatype-entity}

An entity represents a principal, action, or resource in your authorization model. A principal represents an actor in your application, such as a user, or a service that can perform actions. Your application can define the available actions, such as creating, reading, writing, or deleting. Resources contain your data and are acted upon by the principals using the defined actions.

Entities are specified by identifying the type of entity, including the namespace if required, followed by two colon characters \( `::` \) and the unique identifier assigned to this specific entity.

`namespace::type::"unique-identifier"`

```cedar
// A resource of type File
File::"myfile.txt"

// An action to allow reading a resource of type File
Action::"ReadFile"

// A principal of type User with a full UUID as 
// the entity identifier and its friendly name in comments
User::"a1b2c3d4-e5f6-a1b2-c3d4-EXAMPLE11111"
```

{: .important }
>This guide includes examples that use simple entity identifiers, such as `jane` or `bob` for the name of an entity of type `User`. This is done to make the examples more readable. However, in a production system it is critical for security reasons that you use unique values that can't be reused.
>
> We recommend that you use values like [universally unique identifiers \(UUIDs\)](https://wikipedia.org/wiki/Universally_unique_identifier). For example, if user `jane` leaves the company, and you later let someone else use the name `jane`, then that new user automatically gets access to everything granted by policies that still reference `User::"jane"`.
>
> Cedar can't distinguish between the new user and the old. This applies to both principal and resource identifiers. Always use identifiers that are guaranteed unique and never reused to ensure that you don't unintentionally grant access because of the presence of an old identifier in a policy.  
>
> Where you use a UUID for an entity, we recommend that you follow it with the `//` comment specifier and the 'friendly' name of your entity. This helps to make your policies easier to understand. For example:  
>
>```cedar
>principal == User::"a1b2c3d4-e5f6-a1b2-c3d4-EXAMPLE11111", // alice
>```

## Extension {#datatype-extension}

The remaining Cedar data types are introduced as *extension types*. Values of an extension type are introduced by calling a *constructor function* that takes a string as its parameter. Operations on extension types, aside from equality, use a function- or method-call syntax. Equality testing uses `==` as usual.

As of now Cedar supports two extension types: [decimal](#datatype-decimal) and [ipaddr](#datatype-ipaddr).

While Cedar policies can _evaluate_ extension constructor functions and operations applied to _any_ expression, the policy validator will only _validate_ extension constructor and operation calls whose arguments are valid (for the extension type) _string literals_. We say more below.

### decimal {#datatype-decimal}

A value with both a whole number part and a decimal part of no more than four digits.

You specify values of extension type `decimal` by using the [`decimal()` function](../policies/syntax-operators.html#decimal-parse-string-and-convert-to-decimal), e.g.,

```cedar
decimal("12345.1234")
```

(You can't specify a `decimal` as a simple literal.)

A `decimal` value can range from -922337203685477.5808 to 922337203685477.5807.

{: .warning }
>If you exceed the range available for the Decimal data type by supplying a string that exceeds the allowable range, it results in an overflow error. A policy that results in an error is ignored, meaning that a Permit policy might unexpectedly fail to allow access, or a Forbid policy might unexpectedly fail to block access.

Constructor calls such as `decimal(context.num)` and `decimal(if true then "100.01" else "1.01")` can _evaluate_ properly, assuming `context.num` is a string of the accepted format, but will not _validate_. To validate, the `decimal()` constructor must be given a _string literal_. If calling `decimal()` with the string literal would produce an overflow, the constructor call is also deemed invalid.

### ipaddr {#datatype-ipaddr}

A value that represents an IP address. It can be either IPv4 or IPv6. The value can represent an individual address or a range of addresses, by adding a [CIDR suffix](https://wikipedia.org/wiki/Classless_Inter-Domain_Routing#CIDR_notation) (a slash `/` and an integer) after the address.

You specify values of extension type `ipaddr` using the [ip() operator](../policies/syntax-operators.html#ip-parse-string-and-convert-to-ipaddr). Here are some examples:

```cedar
ip("192.168.1.100")    // a single IPv4 address
ip("10.50.0.0/24")     // an IPv4 range with a 24-bit subnet mask (255.255.0.0)
ip("1:2:3:4::/48")     // an IPv6 range with a 48-bit subnet mask
```

Constructor calls such as `ip(context.addr)` and `ip(if context.addr like "145.*" then context.addr else "127.0.0.1")` can _evaluate_ properly, assuming `context.addr` is a string of the accepted format, but will not _validate_. To validate, the `ip()` constructor must be given a _string literal_. If calling `ip()` with the string literal would produce an error due to the string literal being in an incorrect format, the constructor call is also deemed invalid.
---
layout: default
title: Data types
parent: Policy syntax
nav_order: 3
---

# Cedar syntax \- data types supported by the policy language<a name="syntax-datatypes"></a>
{: .no_toc }

The Cedar policy language supports values and expressions of the following data types\.

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Boolean<a name="datatype-boolean"></a>

A value that is either `true` or `false`\.

## String<a name="datatype-string"></a>

A sequence of characters consisting of letters, numbers, or symbols\.

Cedar doesn't have a string length limit, but services that use Cedar are likely to have limits for each element of type string\.

## Long<a name="datatype-long"></a>

An whole number without decimals that can range from \-9223372036854775808 to 9223372036854775807\.

## Decimal<a name="datatype-decimal"></a>

A value with both a whole number part and a decimal part of no more than four digits\. 

The value can range from \-922337203685477\.5808 to 922337203685477\.5807

## Set<a name="datatype-set"></a>

A collection of elements that can be of the same or different types\. A set is constructed using bracket characters `[` and `]` and separating the elements with commas\. For example:

```
// a set of three elements, two of type long, and one of type string
[2, 4, "hello"]

// a set of a single type long
[-1]

// an empty set
[ ]

// a set with a Boolean expression, a nested set, and a Boolean value
[3<5, ["nested", "set"], true]
```

## Record<a name="datatype-record"></a>

A collection of *attributes*\. Each attribute consists of a name and an associated value\. Names are simple strings\. Values can be of any type\. You can access an attribute's value by referencing its name as an index using either of the following syntax options:
+ `record["attributename"]`
+ `record.attributename`

For example:

```
{"key": "some value", id:"another value" }
```

You can reference the first attribute as either `record["key"]` or `record.key`\. Both options evaluate to `"some value"`\.

Records can also be nested\. To access them use any of the following options:
+ All using `[]` – `record["some"]["nested"]["attribute"]`
+ All using `.` – `record.some.nested.attribute`
+ A mix of both – `record["some"].nested["attribute"]`

Other examples:

```
{}
{"foo": 2, bar: [3, 4, -47], ham: "eggs", "hello": true }
```

## Entity<a name="datatype-entity"></a>

An entity represents a principal, action, or resource in your authorization model\. A principal represents an actor in your application, such as a user, or a service that can perform actions\. You application can define the available actions, such as creating, reading, writing, or deleting\. Resources contain your data and are acted upon by the principals using the defined actions\.

Entities are specified by identifying the type of entity, including the namespace if required, followed by two colon characters \( `::` \) and the unique identifier assigned to this specific entity\.

`namespace::type::"unique-identifier"`

```
// A resource of type File
File::"myfile.txt"

// An action to allow reading a resource of type File
Action::"ReadFile"

// A principal of type User with a full UUID as 
// the entity identifier and its friendly name in comments
User::"a1b2c3d4-e5f6-a1b2-c3d4-EXAMPLE11111"
```

{: .important }
>This guide includes examples that use simple entity identifiers, such as `jane` or `bob` for the name of an entity of type `User`\. This is done to make the examples more readable\. However, in a production system it is critical for security reasons that you use unique values that can't be reused\. We recommend that you use values like [universally unique identifiers \(UUIDs\)](https://wikipedia.org/wiki/Universally_unique_identifier)\. For example, if user `jane` leaves the company, and you later let someone else use the name `jane`, then that new user automatically gets access to everything granted by policies that still reference `User::"jane"`\. Cedar can't distinguish between the new user and the old\. This applies to both principal and resource identifiers\. Always use identifiers that are guaranteed unique and never reused to ensure that you don't unintentionally grant access because of the presence of an old identifier in a policy\.  
>Where you use a UUID for an entity, we recommend that you follow it with the `//` comment specifier and the 'friendly' name of your entity\. This helps to make your policies easier to understand\. For example:  
>```
>principal == User::"a1b2c3d4-e5f6-a1b2-c3d4-EXAMPLE11111", // alice
>```

## IPaddr<a name="datatype-ipaddr"></a>

A value that represents an IP address\. It can be either IPv4 or IPv6\. It can represent an individual address or, by adding a [CIDR suffix](https://wikipedia.org/wiki/Classless_Inter-Domain_Routing#CIDR_notation) \(a slash `/` and an integer\) after the address\.

```
192.168.1.100    // a single IPv4 address
10.50.0.0/24     // an IPv4 range with a 24-bit subnet mask (255.255.0.0)
1:2:3:4::/48     // an IPv6 range with a 48-bit subnet mask
```
---
layout: default
title: Basic Cedar syntax
nav_order: 1
---

# Basic policy construction in Cedar<a name="syntax-policy"></a>
{: .no_toc }

A policy is a text document that includes the following elements:

+ **[Effect](#term-policy-effect)** &ndash; The effect specifies the *intent* of the policy, to either *permit*` or *forbid* any request that matches the scope and conditions specified in the policy.

+ **[Scope](#term-policy-scope)** &ndash; The scope specifies the combination of principals, actions, and resources to which the policy applies. Inclusion of these elements is mandatory. A policy that has *only* a scope without additional context conditions can be part of a [role-based access control](https://wikipedia.org/wiki/Role-based_access_control) strategy.

+ **[Conditions](#term-parc-context)** &ndash; *(Optional)* You can optionally provide additional conditions. These conditions must be satisfied for the policy to affect the evaluation of the authorization request. These conditions are expressed as `when` and `unless` clauses. You can use the conditions to evaluate the attributes of the principals, resources, and other elements that make up the context of the request. A policy that includes conditions can be part of an [attribute-based access control](https://wikipedia.org/wiki/Attribute-based_access_control) strategy.

+ **[Annotations](#term-parc-annotations)** &ndash; *(Optional)* An annotation is an arbitrary string value that can be used by other services that read and process Cedar policies. An annotation has no impact on policy evaluation.

The policy must end with a semicolon character (`;`).

When the request exactly matches the scope, and all of the context conditions evaluate to `true`, then that policy evaluates to `true`. This process repeats for all policies that are relevant to the principal and resources referenced by the request.

{: .important }
>This guide includes examples that use simple entity identifiers, such as `jane` or `bob` for the name of an entity of type `User`. This is done to make the examples more readable. However, in a production system it is critical for security reasons that you use unique values that can't be reused.
>
> We recommend that you use values like [universally unique identifiers \(UUIDs\)](https://wikipedia.org/wiki/Universally_unique_identifier). For example, if user `jane` leaves the company, and you later let someone else use the name `jane`, then that new user automatically gets access to everything granted by policies that still reference `User::"jane"`.
>
> Cedar can't distinguish between the new user and the old. This applies to both principal and resource identifiers. Always use identifiers that are guaranteed unique and never reused to ensure that you don't unintentionally grant access because of the presence of an old identifier in a policy.  
>
>Where you use a UUID for an entity, we recommend that you follow it with the `//` comment specifier and the 'friendly' name of your entity. This helps to make your policies easier to understand. For example:
>
>```cedar
>principal == User::"a1b2c3d4-e5f6-a1b2-c3d4-EXAMPLE11111", // alice
>```

## Effect<a name="term-policy-effect"></a>

The effect of the policy specifies whether Cedar should *permit* or *forbid* requests that evaluate as a match for the policy. The `effect` element can have one of the following values:

+ `permit` – If all elements in the policy match, then the policy results in an `Allow`.
+ `forbid` – If all elements in the policy match, then the policy results in a `Deny`.

After all policies in the policy store are evaluated, the results are combined as follows:

+ If *at least one* matching policy results in `Allow` **and** there are exactly zero policies that result in `Deny`, then the overall result of the evaluation is `Allow`.
+ If *at least one* matching policy results in `Deny` **or** if there are exactly zero policies that result in `Allow`, then the overall result of the evaluation is `Deny`.

The following are two key principles to remember that embody the previous two rules:

+ The default result, exemplified by an empty set of policies, is a `Deny` for the request, because there isn't at least one policy that results in `Allow`. This is referred to as an *implicit deny*.
+ A `Deny` result for any policy evaluation results in an overall `Deny` for the request. This is referred to as an *explicit deny*.
**Important**  
An explicit `Deny` for any one policy ***always*** overrides any `Allow` from other policies.

### Effect examples<a name="term-policy-effect-examples"></a>
{: .no_toc }

#### `permit`<a name="term-policy-effect-examples-permit"></a>

The following `permit` example policy allows Alice to view a specific photo.

```cedar
permit (
    principal == User::"alice", 
    action == Action::"view", 
    resource == Photo::"VacationPhoto94.jpg"
);
```

#### `forbid`<a name="term-policy-effect-examples-forbid"></a>

The following `forbid` example policy denies any action by any user except the resource's `owner` on any resource that has the `private` attribute set to `true`, unless the principal making the request is the resource `owner`. This policy doesn't explicitly allow anything; it only forbids when it matches. A resource owner making a request on a `private` resource must still have a separate policy that explicitly allows the action on the specified resource.

```cedar
forbid (
    principal,
    action,
    resource
)
when {
    resource.private
}
unless {
    principal == resource.owner
};
```

## Scope<a name="term-policy-scope"></a>

A request always includes information that Cedar uses to answer the following three questions:

+ [Principal](#term-parc-principal) –Who is making the request?
+ [Action](#term-parc-action) – What operation does the principal want to perform?
+ [Resource](#term-parc-resource) – What does the principal want to perform the action on?

The scope section of a Cedar policy statement defines which values *match* the request.

### `principal`<a name="term-parc-principal"></a>

The `principal` element in a Cedar policy represents a role, user, service, or other identity that can make a request to perform an `action` on a `resource` in your application. If the principal making the request matches the `principal` defined in this policy statement, then this element matches.

The `principal` element must be present. If you specify only `principal` without an expression that constrains its scope, then the policy applies to *any* principal.

#### Examples of the `principal` element<a name="term-parc-principal-examples"></a>
{: .no_toc }

```cedar
//matches any principal entity of any type
principal

//matches only the one specified entity of type User
principal == User::"alice"

//matches any principal in the hierarchy of the specified Group
principal in Group::"alice_friends"
```

### `action`<a name="term-parc-action"></a>

The `action` element in a Cedar policy is a list of the operations in your application for which this policy statement controls access. If the operation in the request matches one of the `action` items defined in this policy statement, then this element matches.

#### Examples of the `action` element<a name="term-parc-action-examples"></a>
{: .no_toc }

```cedar
//matches any action
action

//matches only the one specified action
action == Action::"view"

//matches any of the listed actions
action in [Action::"listAlbums", Action::"listPhotos", Action::"view"]

//matches any action in the hierarchy of the admin entity of type PhotoFlashRole
action in PhotoFlashRole::"admin"
```

### `resource`<a name="term-parc-resource"></a>

The resource element in a Cedar policy is a resource defined by your application that can be accessed or modified by the specified action.

The `resource` element must be present. If you specify only `resource` without an expression that constrains its scope, then the policy applies to *any* resource.

The `principal`, `action`, and `resource` elements are defined as entities.

#### Examples of the `resource` element<a name="term-parc-resource-examples"></a>
{: .no_toc }

```cedar
//matches any resource
resource

//matches only the one specified resource of type Photo
resource == Photo::"VacationPhoto94.jpg"

//matches any resource that is in the hierarchy of the specified entity of type Album
resource in Album::"alice_vacation"
```

## Conditions<a name="term-parc-context"></a>

Conditions specify any additional constraints that Cedar must consider when deciding to allow or deny the request. Every `when` condition must evaluate to `true` and every `unless` condition must evaluate to `false` for the policy to match and contribute to the final decision. The conditions evaluate details that are unique to a particular access request. Consider a web service that accepts HTTP requests. The conditions for such a request might include things like the IP address from which the request originates, the HTTP headers in the request, the time of day that the request was sent, the user’s authentication posture, or detailed information about the query parameters in the HTTP request.

Conditions can also evaluate attributes of the principals and resources specified in the query. For example, a policy could contain a condition that specifies that principals can edit any photo that has an `owner` attribute with a value that matches the ID of the principal making the request.

```cedar
permit (
    principal, 
    action == Action::"editPhoto", 
    resource
)
when {
   resource.owner == principal
};
```

The scope values of `principal`, `action`, and `resource` represent stable information in the system and must be present in every request. In comparison, `context` represents information about a point-in-time request and is required only for relevant request scenarios.

Context elements take the following two forms:

+ [`when`](#term-parc-context-when)
+ [`unless`](#term-parc-context-unless)

### `when`<a name="term-parc-context-when"></a>

The `when` clause causes the policy to match the request only if the embedded expression evaluates to `true`.

#### Examples of the `when` clause<a name="term-parc-context-when-examples"></a>
{: .no_toc }

The following `when` example matches the request if the principal making the request is a member of the `HardwareEngineering` department and has a `jobLevel` of at least `5`. If either attribute is missing from the principal making the request, then the policy doesn't match.

```cedar
when {
    principal.department == "HardwareEngineering" 
    &&
    principal.jobLevel >= 5
}
```

The following `when` example matches the request if the request was submitted before the specified Unix time.

```cedar
when {
  context.time.now < 1698423180
}
```

The following `when` example matches the request if the principal in the request is a member of the list of entities named `sharedWith` associated with the `Album` entity named `"janeTrips"`.

```cedar
when {
    principal in PhotoFlash::Album::"janeTrips".sharedWith
}
```

### `unless`<a name="term-parc-context-unless"></a>

The `unless` clause causes the policy to match the request only if the embedded expression evaluates to `false`.

#### Examples of the `unless` clause<a name="term-parc-context-unless-examples"></a>
{: .no_toc }

The following `unless` clause does ***not*** match the request if the principal making the request is the resource's owner.

```cedar
unless {
  principal == resource.owner
}
```

The following policy example denies any request if the calling principal isn't authenticated with multi-factor authentication \(MFA\). The policy assumes that `usedMFA` evaluates as a boolean to `true` or `false`.

```cedar
forbid ( principal, action, resource )
unless {
  context.authentication.usedMFA
};
```

## Annotations<a name="term-parc-annotations"></a>

You can attach arbitrary string values to Cedar policies in the form of annotation. An annotation has no impact on policy evaluation. Annotations are stored as part of the policy and are available for use by services that read and process Cedar policies.

You can place annotations only at the very top of the policy before the [effect](#term-policy-effect) element.

An annotation takes the form of the following string:

```cedar
@annotationname("annotation value")
```

The following example shows two annotations that could be part of a policy.

```cedar
@advice("My advice")
@id("My ID")
permit (
    ...
);
```

---
layout: default
title: Populate the policy scope
nav_order: 5
---

# Best practice: When possible, populate the policy scope
{: .no_toc }

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

The [policy scope](../overview/terminology.html#policy) is the portion of a Cedar policy statement after the `permit` or `forbid` keywords and between the opening parenthesis.

![\[Illustrates the structure of a Cedar policy, including the scope.\]](images/structure-of-policy.png)

We recommend that you populate the values for `principal` and `resource` whenever possible. This lets you index your policies in storage for more efficient retrieval, which can improve performance. If you need to grant the same permissions to many different principals or resources, we recommend that you use a [policy template](../policies/templates.html) and attach it to each principal and resource pair.

Avoid creating one large policy that contains lists of principals and resources in a `when` clause. Doing so will likely cause you to run into scalability limits or operational challenges. For example, in order to add or remove a single user from a large list within a policy, it is necessary to read the whole policy, edit the list, write the new policy in full, and handle concurrency errors if one administrator overwrites another's changes. In contrast, by using many fine-grained permissions, adding or removing a user is as simple as adding or removing the single policy that applies to them.

## Why unconstrained policies are a bad practice

Resist the temptation to move imperative authorization code into `when` clauses. It is the path of least resistance, but it is a dead end from a scaling and analysis perspective.

In a pre-Cedar world, with imperative authorization code, the application layer only ever runs _some_ of that code. Whenever a request comes in for "Alice" to view "Landscape.jpg", the application server runs some bespoke checks for that request handler.

If, when using Cedar, all your policies are unconstrained, then _every bit of authorization logic in your application will run for every request_. This is undesirable from a performance standpoint, from an I/O standpoint (having to load many policies), and from an analysis standpoint. If you author cedar policies in this way, it will be difficult to implement true discretionary permissions (where any user can be granted access to any resource) due to performance reasons. In a large application with a large user base that supports discretionary access grants, you might end up with millions of policies. It's difficult to get this to perform well without using the `principal` and `resource` head constraints.

The ideal scenario is that the _amount_ of authorization conditions that are evaluated by cedar don't significantly increase with respect to the legacy/imperative approach. When a request comes in for a specific principal trying to perform a specific action on a specific resource, the authorization engine should evaluate only a handful of policies - those pertaining to this specific principal, its groups, the specific resource, and its groups. You should segment your authorization model so there are few policies to reason about for each request.

### The policy IS the relationship

A Cedar policy represents the relationship between a principal and a resource. There are global policies for relationships that you always want to exist — these express permissions that are invariants of the system, such as "Admins can do all actions on all resources." But when you are granting permissions to a specific user to access a specific thing, each policy should model that specific relationship.

You might worry that this creates too many policies. For example, if you have 10 users and 10 resource types, that could mean 100 policies. This is expected and correct. Cedar is designed to handle large numbers of fine-grained policies efficiently because each authorization request only evaluates the small subset of policies relevant to that specific principal, action, and resource combination.

The user experience you can provide with fine-grained policies is also cleaner and easier to implement. Instead of building complex AND/OR statement builders that wrangle with ASTs under the hood, your permission management interface simply connects specific principals (or principal groups) to specific resources (or resource groups).

## Common mistakes

### Mistake 1: Modeling roles and groups as attributes {#mistake-roles-as-attributes}

A common mistake is to model roles or groups as string attributes on the principal entity and then use `when` clauses to check them. Instead, model roles and groups as parent entities in the Cedar entity hierarchy.

**Wrong — role as an attribute:**

```cedar
permit(
    principal,
    action == App::Action::"ViewReport",
    resource
)
when { principal.role == "analyst" };
```

This policy is unconstrained in both `principal` and `resource`. Every authorization request for `ViewReport` must evaluate this policy and check the attribute.

**Right — role as a group in the entity hierarchy:**

```cedar
permit(
    principal in App::Role::"analyst",
    action == App::Action::"ViewReport",
    resource
)
```

By modeling the role as a group entity that users are members of, you populate the principal scope. The authorization engine can index on this and skip the policy entirely for principals who are not in the `analyst` group.

### Mistake 2: Thinking there is no resource you can name {#mistake-no-resource}

A common mistake is to leave the `resource` scope empty because you believe there is no specific resource to reference. In practice, you can always constrain the resource. At a minimum, you can use `resource is NS::ResourceType` to constrain by type. Beyond that, you can use **synthetic resource groups** to name a resource in your policies.

A synthetic resource group is an entity you create to represent "all resources of this type." Every specific resource of that type lists the synthetic group as a parent. This gives you two options:

1. **Grant access to all resources of a type** — reference the synthetic group directly.
2. **Grant access to a specific resource** — reference the specific resource entity, which has the synthetic group as a parent.

**Example: Synthetic resource group**

Given an action that applies to resources of type `Instrument`:

```cedar
permit(
    principal == Platform::User::"user-123",
    action == Platform::Action::"activateInstrument",
    resource == Platform::Instrument::"inst-456"
);
```

The entities you send in the authorization request include both the specific resource and the synthetic group:

```json
[
    {
        "uid": { "type": "Platform::Instrument", "id": "inst-456" },
        "attrs": {},
        "parents": [
            { "type": "Platform::Instrument", "id": "all" }
        ]
    },
    {
        "uid": { "type": "Platform::Instrument", "id": "all" },
        "attrs": {},
        "parents": []
    }
]
```

To grant access to all instruments, reference the synthetic group:

```cedar
permit(
    principal == Platform::User::"user-123",
    action == Platform::Action::"activateInstrument",
    resource in Platform::Instrument::"all"
);
```

**Modeling tenancy with resource hierarchy**

If your application is multitenant, you can model tenancy as a parent-child relationship rather than a string attribute checked in a `when` clause. This enables cross-tenant management scenarios where one user has access across multiple tenants:

```cedar
permit(
    principal == Platform::User::"user-123",
    action in Platform::Action::"reportActions",
    resource in Platform::Tenant::"acmeCorp"
);

permit(
    principal == Platform::User::"user-123",
    action in Platform::Action::"reportActions",
    resource in Platform::Tenant::"umbrellaCorp"
);
```

Because each of these policies specifies a concrete resource, they can be indexed efficiently. This approach is more flexible and future-proof than checking a tenancy attribute in a `when` clause.

### Mistake 3: Using generic actions that span many resource types {#mistake-generic-actions}

This mistake is closely related to the best practice of [mapping actions to the business domain](../bestpractices/bp-map-actions.html).

When you define generic actions like `View` or `Read` that apply to dozens of resource types, you make it difficult to populate the resource scope. You end up choosing between two bad options:

**Option 1: Overly broad permissions.** If you write a policy granting a user `View` access without constraining the resource, they get `View` access to everything — all resource types that `View` applies to.

**Option 2: Complex duck-typing in `when` clauses.** To work around Option 1, you add `when` clauses that check for the presence of specific attributes to determine the resource type:

```cedar
// Don't do this
permit(
    principal == App::User::"alice",
    action == App::Action::"View",
    resource
)
when {
    resource has projectId &&
    resource.projectId == "proj-123"
};
```

This is fragile, hard to analyze, and defeats the purpose of having a typed schema.

**The fix:** Define business-specific actions that map to specific resource types. Instead of a single `View` action, define `ViewProject`, `ViewDocument`, `ViewDashboard`, etc. Each action applies to exactly one resource type, making it straightforward to populate the full policy scope. See [Map actions to the business domain](../bestpractices/bp-map-actions.html) for more details.

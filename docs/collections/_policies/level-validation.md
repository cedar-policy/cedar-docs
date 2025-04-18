---
layout: default
title: Policy level validation
nav_order: 9
---

# Cedar policy level validation {#level-validation}
{: .no_toc }

Cedar [authorization requests](../auth/authorization.md) require evaluating policies given a `principal`, `action`, `resource`, `context`, and all entity data that could be relevant for that request.
This may sound straight-forward at first, but it's not always obvious how to select the relevant entity data for an authorization request.
If our only concern is always selecting all relevant data, then we can take the easiest option and always select _all_ entity data.
It is always safe to include all entity data, but, for applications with a large amount of entity data, making all of it available might be too difficult or expensive.

Cedar provides policy level validation to help applications limit the amount of entity data required for authorization requests.
Policy level validation is an extra validation stage performed after standard policy validation.
Where policy validation aims to prevents mistakes in your policy logic without placing any undue restrictions on what policies you can write, level validation places additional restrictions on policies to make it easier to understand what entity data they could possibly need to access.

When validating a policy at level `n`, policy level validation ensures that there is no chain of entity dereferencing operations longer than `n`.
This guarantees that an entity will not be accessed unless it's reachable by traversing fewer than `n` entity attributes.
All relevant entity data can then be collected by using a procedure called level-based slicing.
Starting from the entities in the request (`principal`, `action`, `resource`, and any entities in the `context` record) and, repeating while the slicing level `n` is greater than `0`, gathering the data for these entities and recursively slicing starting from any entities in their attributes records from the currently selected entities.
Using this slicing procedure guarantees an authorization request made using the sliced entity data will give the same result as an authorization request using all entity data.

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Understanding Level Validation {#level-validation}

Cedar uses the concept of levels to control how deeply policies can access entity data by traversing entity attributes and tags.
Each level represents one step of attribute access from the root entities (`principal`, `action`, `resource`, and any entities referenced in the `context`).
When validating at level `n`, a policy is not allowed to contain a chain of entity dereferencing operations longer than `n`, ensuring that all accessed entity data is reachable in `n` steps from the entity root.

### Restricted operations

Level validation specifically restricts entity dereferencing expressions.
An entity dereferencing expression is any expression that needs to access an entity's data.
These operation may error or otherwise return an unexpected result when attempting to access the data for an entity that was not included in the authorization request.

* **Entity Attribute operations**: Attribute access (`.`) and presence test (`has`) operations on entities require entity data to inspect the attributes of the target expression. These operations apply to records where they are not restricted by level validation.
* **Tag operations**: Tag access (`getTag`) and presence test (`hasTag`) operations require entity data to inspect the tags of the target expression. These are binary operator, but level validation only restricts their first operand.
* **Hierarchy membership**: The binary `in` operator needs to access the list of ancestors entities for its first operand. Level validation does not restrict the second operand because `in` does not need to know its ancestor entities.

All other operations are unrestricted by level validation, needing only to follow the rules enforced by regular policy validation.

### Level 0 access

At level 0, policies are restricted from applying any of the entity dereferencing operations on any entities.
This ensure that policies don't access any entity data.
You can compare entities for equality and check their entity type, but you cannot access their attributes and tags or query the entity hierarchy using the `in` operator.
Since the `context` is a record rather than an entity, it is possible to access context attributes.

The following operations are all allowed at level 0 even though they interact with the request variables.
They don't require any entity data, so they are valid operations at any level.
```cedar
principal is User
action == Action::"view"
context.is_authenticated
```

If all policies validate at level 0, then we know that no policies can access entity data in any way.
This makes safely selecting all relevant entity data exceptionally easy - we don't need any entity data.
Of course, we've heavily restricted what policies we're allowed to write.
Even a simple operation such as `principal in Group::"admins"` would be reported as a level validation error because the `in` operation requires access to entity data for `principal`.

### Level 1 access

At level 1, policies can directly access the entity data for the root entities.
This means an attribute access or entity hierarchy query using `in` is allowed, but a more deeply nested chaining multiple entity attribute or tag access operations is not.

In addition to the operations allowed at level 0, the following operations are allowed at level 1.
```cedar
principal.is_admin
action in Action::"read_only"
principal has manager && principal.manager == User::"Ethel"
resource.hasTag("level") && resource.getTag("level") > 4
```

If all policies validate at level 1, then we know that policies only access the data for entities included immediately in the request.
Unlike at level zero, we do need to collect _some_ entity data, but the process doesn't require gathering data for entities requiring even a single attribute access to reach.

### Higher level access

At higher levels policies can continue to use any features available at lower levels and also start to compose entity dereferencing operations to build complex expressions indirectly accessing entity data.
Where a level 1 policy can only allow a direct attribute access like `resource.owner`, at level two a policy can allow `resource.owner.is_admin` or `resource.owner in Group::"admins"`.
Levels three and higher continue to support more complex expressions formed by composing entity dereferencing expressions like `principal.getTag("file0.txt").`

### Entity Literals

All dereferencing expressions on entity literals When using level validation at any level.
Entity literals are not represented anywhere the principal, action, resource or context of an authorization request so cannot be collected by the level-based slicing procedure.
If level validation allowed access to attributes of entity literals, it would not be able to guarantee that data for that literal was selected during entity slicing, meaning that the authorization decision for a request depending on that entity could change.

The following expressions are not accepted at any level because they deference an entity literal.
```cedar
User::"alice".is_admin
User::"alice" has manager
Doc::"my_doc" in principal.folder
```

## Level-Based Entity Slicing {#level-based-slicing}

Level validation places a limit on how much entity data a policy can access.
Given an authorization request, level-based entity slicing takes advantage of this limit to select a subset of the entity data that we know will contain all relevant data required for evaluating the request.

todo: high level description of slicing algorithm

## Limitations {#limitations}

The slicing procedure selects all data for an entity, without considering how entities are used in any specific policies.
If a particular attribute is never accessed by any policy, but is specified by the schema, level based entity slicing will always include that attribute.
Similarly, it will always retrieve the set of ancestors for an entity even if the specific policies never use the `in` operator.

Slicing at a level will always retrieve data for all entities reachable up to that level, even if the policies would validate at a lower level.
To avoid fetching entity data that will never be accessed, be sure to validate policies at the lowest level you can.

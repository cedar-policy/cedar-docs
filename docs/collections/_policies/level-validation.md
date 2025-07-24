---
layout: default
title: Policy level validation
nav_order: 9
---

# Cedar policy level validation {#level-validation}
{: .no_toc }

Cedar [authorization requests](../auth/authorization.html) require evaluating policies given a `principal`, `action`, `resource`, `context`, and all entity data that could be relevant for that request.
This may sound straight-forward at first, but it's not always obvious what entity data is actually relevant for a particular request.
If our only concern is always selecting all relevant data, then we can take the easiest option and select _all_ entity data.
It always safe to include all entity data, but, for applications with a large amount of entity data, using all of it for every request might be too difficult or expensive.

Cedar provides level validation to help applications limit the amount of entity data required for authorization requests.
Level validation is an extra validation stage performed after standard policy validation.
Where policy validation aims to prevent mistakes in your policy logic without placing any undue restrictions on what policies you can write, level validation places additional restrictions on policies to make it easier to understand what entity data they could possibly need to access.
When validating a policy at level `n`, policy level validation ensures that there is no chain of entity dereferencing operations longer than `n`.
This guarantees that an entity will not be accessed unless it's reachable by traversing fewer than `n` entity attributes.

All relevant entity data can then be collected by using a procedure called level-based slicing.
Starting from the entities in the request (`principal`, `action`, `resource`, and any entities in the `context` record), the slicing procedure gathers data for these entities and iteratively collects data for any entities referenced in their attributes.
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

Cedar uses levels to control how deeply policies can access entity data through entity attributes and tags.
Each level represents one step of attribute access from the root entities (`principal`, `action`, `resource`, and any entities referenced in the `context`).
When validating at level `n`, a policy is not allowed to contain a chain of entity dereferencing operations longer than `n`, ensuring that all accessed entity data is reachable in `n` steps from the entity root.
The slicing procedure can then select only the entities reachable in `n` or fewer steps, ignoring all other data.

### Restricted operations

Level validation specifically restricts entity dereferencing expressions - operations that access an entity's data.
These operations may fail or return unexpected results if they attempt to access data for entities not included in the authorization request, so they need to be restricted in order to be sure a policy doesn't depend on data that the slicing procedure won't collect.

* **Entity Attribute operations**: Attribute access (`.`) and presence test (`has`) operations on entities require entity data to inspect the attributes of the target expression. These operations apply to records where they are not restricted by level validation.
* **Tag operations**: Tag access (`getTag`) and presence test (`hasTag`) operations require entity data to inspect the tags of the target expression. These are binary operator, but level validation only restricts their first operand.
* **Hierarchy membership**: The binary `in` operator needs to access the list of ancestors entities for its first operand. Level validation does not restrict the second operand because `in` does not need to know its ancestor entities.

All other operations are unrestricted by level validation, needing only to follow the rules enforced by regular policy validation.

### Level 0 access

Level 0 policies cannot use any entity dereferencing operations.
This ensures that policies don't access any entity data.
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

At level 1, policies can directly access the entity data for the root entities, but cannot access data from entities referenced within those root entities.
This means an attribute access or entity hierarchy query using `in` is allowed, but a more deeply nested chaining multiple entity attribute or tag access operations is not.

In addition to the operations allowed at level 0, the following operations are allowed at level 1.
```cedar
principal.is_admin
action in Action::"read_only"
principal has manager && principal.manager == User::"Ethel"
resource.hasTag("level") && resource.getTag("level") > 4
```

If all policies validate at level 1, then we know that policies only access the data for entities included immediately in the request.
Unlike at level 0, we do need to collect _some_ entity data, but the process doesn't require gathering data for entities requiring even a single attribute access to reach.

### Higher level access

At higher levels policies can continue to use any features available at lower levels and also start to compose entity dereferencing operations to build complex expressions indirectly accessing entity data.
Where a level 1 policy can only allow a direct attribute access like `resource.owner`, at level two a policy can allow `resource.owner.is_admin` or `resource.owner in Group::"admins"`.
Levels three and higher continue to support more complex expressions formed by composing entity dereferencing expressions like `principal.getTag("file0.txt").`

### Entity Literals

Level validation restricts all dereferencing expressions on entity literals, regardless of the validation level.
Entity literals are not represented anywhere in the principal, action, resource or context of an authorization request so cannot be collected by the level-based slicing procedure.
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
The exact implementation of this procedure will depend on how your entity data is stored, so the Cedar library doesn't provide an implementation.
If your entity data is stored in database, you will want to implement entity slicing using database queries to efficiently extract only the required entities without loading the full database into memory.

The level-based entity slicing algorithm is an iterative procedure that works in general for slicing at any level, but an application which always validates and slices at a fixed level may not need to implement the fully general algorithm.
For example, if all policies in an application validate at level 0, then the algorithm can be unrolled assuming slicing at level 0 which always results in selecting an empty set of entity data.
In other words, no entity data is ever required if policies validate at level 0.

If all policies validate at level 1, then the application would need to unroll 1 iteration of the procedure.
This is accomplished by taking the exactly entity UIDs from the request (`principal`, `action`, `resource`, and any entities referenced in `context`) and retrieving their entity data.

The general level-based slicing algorithm applicable at any level *n* starts from the entities in the request, and follows their attributes and tags to discover all entities reachable in *n* access operations.

1. **Start with root entities**: Begin with a *working set* of entities identifiers initialized with the entities directly referenced in the request - the `principal`, `action`, `resource`, and any entities referenced in the `context`.

2. **Initialize the entity slice**: Necessary data will be collected in the *slice* which is initially empty.

3. **Iterative slicing process**: Repeat the following procedure *n* times, once for each level
   - Initialize a new set, to be used as the *next working set*
   - For each entity identifier in the *working set*
     - Lookup the corresponding entity data
     - Insert the entity data into the *slice*
     - Insert into the *next working set* all entity identifiers referenced by the attribute or tags in the *entity data*
   - Set the *working set* to be equal to the *next working set* and continue iteration

At the end of the procedure, the *slice* is now the final set of entity data, containing all the entity data that could possibly be accessed by policies validated at level *n*.

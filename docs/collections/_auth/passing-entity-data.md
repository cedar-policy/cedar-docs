---
layout: default
title: Passing entity data
nav_order: 13
---

# How to ensure the correct entity data is passed to the authorizer {#ensure-correct-entity-data}
{: .no_toc }

When an application calls an authorizer to check if an action is allowed, it passes in data that is evaluated by the authorizer and check against the existing policies. If a policy references an attributes or group membership that isn’t passed in by the calling application the policy won’t apply. For permit policies this can result in access being denied, when it should be permitted. For forbid policies, access can be permitted, when it should be denied. 

This issue arises when the calling application has no knowledge of the available policies. Policies can be written by three groups of people, the *application developers*, the *end users of the application*, and *operators*, such as a security manager or compliance officer. For application developers and the end users we can assume this issue is minimal because the developers will pass in the entity data needed to satisfy the policies they’ve written or have been written using the application they’ve developed. On the other hand, when an operator writes policies, known as *operational policies*, they could quite easily reference entity data the calling application isn’t supplying. 

There are three operational models for creating policies that can mitigate this risk:

+ **Tightly coupled** - The operator must collaborate with the application developer. Each time policies are modified, the application code needs to be reviewed, to verify that the correct entity data is being passed within the authorization request. In some cases, the application code may need to be modified. 
+ **Loosely coupled, unconstrained** - The application developer passes all the resource and principal entities and all entity attribute values. This frees the operator to write any Cedar policy supported by the authorization model, without needing to consult the application developer. 
+ **Loosely coupled, constrained** - The application developer passes the immediate entity data set for the resource and the principal, and the operator works within a defined set of constraints. That includes *all* the attributes of the resource and the principal and the complete group membership chain for these entities; (i.e., the full set of groups that the principal/resource are members of, all the groups that those groups are members of, all the groups that those groups are members of, etc.) This operational model is the recommended best practice for operational policies.

## Best practices for operators {#best-practices-operators}
If an application is developed using the **Loosely coupled, constrained** operational model and the operator abides by the following best practices, they can confidently define policies without consulting the application develope.
### Don't includes pointers to other entities in attributes
Attributes of resources and principals can't be pointers to other entities. The following example policy breaks this best practice, because the resource attribute **Owner** points to another entity. 
```cedar
// This policy breaks the best practice 
forbid ( 
    principal, 
    action == Action::”Delete”, 
    resource == Photo::”Vacation94” ) 
when { 
    resource.Owner == User::“4532434” // Owner is a pointer to another entity
}; 
```
They can however be string literals containing the IDs other entities, as in the following example.
```cedar
// This policy is ok
forbid ( 
    principal, 
    action == Action::”Delete”,
    resource == Photo::”Vacation94”) 
when { 
    resource.OwnerID == “4532434” // OwnerID is a string literal 
};
```
### Don't includes pointers to other entities in context
The context can’t contain attributes that point to entities. For example, you can't define a context attribute called **ResourceOwner** and setting this to point to the **User** entity, as in the following example.
```cedar
// This policy breaks the best practice
forbid ( 
    principal, 
    action == Action::”Delete”, 
    resource == Photo::”Vacation94”) 
when { 
    context.ResourceOwner == User::“4532434” 
};
```
### Don't include entity literals in policies
There can be no entity literals in the body (conditions) of the policy. An entity literal is one that is not described by the principal, action, resource or context in the authorization request. For example, `Album::”Italy2022` is an entity literal in the following policy and breaks this best practice.
```cedar
// This policy breaks the best practice
forbid ( 
  principal, 
  action == Action::”Delete”, 
  resource == Photo::”Vacation94”) 
when { 
  Album::”Italy2022”.Owner == User::“4532434” )
};
```

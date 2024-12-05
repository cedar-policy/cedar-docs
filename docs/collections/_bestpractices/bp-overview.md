---
layout: default
title: Best Practices overview
nav_order: 1
---

# Cedar best practices

The best practices included here outline the most up-to-date recoommendations to get the most out of using Cedar for your authorization engine.

**Best practices**

* [Define and use naming conventions](../bestpractices/bp-naming-conventions.html)
* [Map actions to the business domain](#bp-map-actions)
* [Model all permissions in Cedar](#bp-model-all-perms)
* [Take advantage of user groups](#bp-user-groups)
* [Compound authorization is normal](../bestpractices/bp-compound-auth.html)
* [Prefer fine-grained permissions in the model and aggregate permissions in the user interface ](../bestpractices/bp-fine-grained-permissions.html)
* [Use attributes or templates to represent relationships ](../bestpractices/bp-relationship-representation.html)
* [Every resource lives in a container ](../bestpractices/bp-resources-containers.html)
* [Separate the principals from the resource containers ](../bestpractices/bp-separate-principals.html)
* [When possible, populate the policy scope ](../bestpractices/bp-populate-policy-scope.html)
* [Normalize input data prior to invoking the authorization APIs](../bestpractices/bp-normalize-data-input.html)
* [Don’t use the context field to hold information about the principal, action, and resource ](../bestpractices/bp-using-the-context.html)
* [Implement meta-permissions as policies](../bestpractices/bp-meta-permissions.html)
* [Avoid mutable identifiers in policies ](../bestpractices/bp-mutable-identifiers.html)
* [Use role-based access control as part of your authorization strategy](../bestpractices/bp-implementing-roles.html)
* [Consider other reasons to query authorization ](../bestpractices/bp-other-considerations.html)
* [Define and use naming conventions](../bestpractices/bp-naming-conventions.html)

## Map actions to the business domain {#bp-map-actions}

When designing your authorization model, the actions you define should be business actions, not API actions. `POST` and `GET` should not be defined as actions, instead focus on actions your users perform. For example, a support technician may perform the `CreateSupportCase`, `ListSupportCase`, and `ViewSupportCase` actions.

## Model all permissions in Cedar {#bp-model-all-perms}

Before you started using Cedar you may have used a permissions table in your database that linked principal IDs to resource IDs. When moving to Cedar it’s best practice to move all your permissions determination logic to Cedar policies. If you have a permissions table, each row of that table would become a separate Cedar policy.

## Take advantage of user groups {#bp-user-groups}

When creating your authorization model there might have been multiple user types created, such as `Admin`, `CustomerSupportTech`, `FinanceUser`, etc. In Cedar, we recommend only creating one user type, such as `User`, and creating [Groups](../overview/terminology.html#term-group) that map to the different kinds of users you have and control their permissions at the group level.

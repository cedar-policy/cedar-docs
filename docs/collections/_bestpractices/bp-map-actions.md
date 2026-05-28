---
layout: default
title: Map actions to the business domain
nav_order: 3
---

# Best practice: Map actions to the business domain

{: .no_toc }

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

When designing your authorization model, the actions you define should be business actions, not API actions. `POST` and `GET` should not be defined as actions, instead focus on actions your users perform. For example, a support technician may perform the `CreateSupportCase`, `ListSupportCase`, and `ViewSupportCase` actions.

## Why generic actions are problematic

When you define generic actions like `GET`, `POST`, `View`, `Edit`, or `Delete` that apply to many resource types, you make it difficult to write well-scoped policies. A generic `View` action might have 50 different resource types in its `appliesTo` list. This forces you to choose between two bad options:

**Option 1: Overly broad permissions.** A policy that grants `View` without constraining the resource grants access to *all* resource types that `View` applies to. Any time a user gets `View` access to one kind of resource, they get it for everything.

```cedar
// Grants View access to ALL resource types — documents, projects, dashboards, etc.
permit(
    principal == App::User::"alice",
    action == App::Action::"View",
    resource
);
```

**Option 2: Fragile duck-typing in `when` clauses.** To avoid Option 1, you add `when` clauses that check for the presence of specific attributes to determine what type of resource you're dealing with:

```cedar
// Fragile — relies on attribute presence to infer resource type
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

This is fragile, hard to analyze, and defeats the purpose of having a typed schema. It also prevents the authorization engine from indexing policies efficiently, since the resource scope is unconstrained. See [When possible, populate the policy scope](../bestpractices/bp-populate-policy-scope.html) for more on why this matters.

## Define actions per resource type

Instead of generic actions, define business-specific actions that each apply to exactly one resource type:

```cedar
// Each action maps to one resource type — clean, indexable, easy to reason about
permit(
    principal == App::User::"alice",
    action == App::Action::"ViewProject",
    resource == App::Project::"proj-123"
);

permit(
    principal == App::User::"alice",
    action == App::Action::"ViewDashboard",
    resource in App::Dashboard::"all"
);
```

In the second policy, `App::Dashboard::"all"` is a **synthetic group** — it doesn't need to correspond to a real object in your application. You simply include it as a parent of every dashboard entity when you make an authorization request. This gives you a way to write policies that apply to all dashboards without leaving the resource scope unconstrained. See [When possible, populate the policy scope](../bestpractices/bp-populate-policy-scope.html#mistake-no-resource) for more on synthetic resource groups.

### Using the `is` clause as an alternative

You can also constrain the resource by type using the `is` clause:

```cedar
permit(
    principal == App::User::"alice",
    action == App::Action::"ViewDashboard",
    resource is App::Dashboard
);
```

This accomplishes the same thing as `resource in App::Dashboard::"all"` — it ensures the policy only applies to dashboard resources — without requiring you to set up a synthetic group. Use whichever approach fits your policy storage model: the `is` clause is simpler when you just need type-level scoping, while synthetic groups are useful when you also want to grant access to specific subsets of resources via hierarchy.

With this approach:
- Each policy can fully populate the scope (principal, action, and resource).
- The authorization engine evaluates only the policies relevant to the specific action being requested.
- Permissions are easy to reason about — granting `ViewProject` access has no effect on dashboards or documents.
- You can use [action groups](../overview/terminology.html#term-action-group) to bundle related actions when needed (e.g., `App::Action::"financeActions"` containing actions for both `Transaction` and `FinancialStatement` types - `App::Action::"ViewTransaction"`, `App::Action::"CreateTransaction"`, `App::Action::"UpdateTransaction"`, `App::Action::"ViewFinancialStatement"`, `App::Action::"CreateFinancialStatement"`, `App::Action::"UpdateFinancialStatement"`).

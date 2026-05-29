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

## Why generic actions are a bad practice

Consider this schema:

```cedar
namespace ProjectApp {
    entity User = {};

    entity Project = {};
    entity Task = {};
    entity TaskComment = {};
    entity Sprint = {};
    entity Epic = {};

    action Create appliesTo {
        principal: [User],
        resource: [Project, Task, TaskComment, Sprint, Epic]
    };
    action View appliesTo {
        principal: [User],
        resource: [Project, Task, TaskComment, Sprint, Epic]
    };
    action Update appliesTo {
        principal: [User],
        resource: [Project, Task, TaskComment, Sprint, Epic]
    };
    action Delete appliesTo {
        principal: [User],
        resource: [Project, Task, TaskComment, Sprint, Epic]
    };
}
```

When you define generic actions like `Create`, `View`, `Update`, or `Delete` that apply to many resource types, you make it difficult to write well-scoped policies. This generic `View` action has 5 different resource types in its `appliesTo` list. This nudges you to choose between two bad options:

**Option 1: Overly broad permissions.** A policy that grants `View` without constraining the resource grants access to *all* resource types that `View` applies to. Any time a user gets `View` access to one kind of resource, they get it for everything.

```cedar
// Grants View access to ALL resource types — documents, projects, dashboards, etc.
permit(
    principal == ProjectApp::User::"alice",
    action == ProjectApp::Action::"View",
    resource
);
```

**Option 2: Fragile duck-typing in `when` clauses.** To avoid Option 1, you add `when` clauses that check for the presence of specific attributes to determine what type of resource you're dealing with:

```cedar
// Fragile — relies on attribute presence to infer resource type
permit(
    principal == ProjectApp::User::"alice",
    action == ProjectApp::Action::"View",
    resource
)
when {
    resource has projectId &&
    resource.projectId == "proj-123"
};
```

This is fragile, hard to analyze, and largely defeats the purpose of having a typed schema. It also prevents the authorization engine from indexing policies efficiently, since the resource scope is unconstrained. See [When possible, populate the policy scope](../bestpractices/bp-populate-policy-scope.html) for more on why this matters.

## Define actions per resource type

Instead of generic actions, define business-specific actions that each map exactly to one action a user of your app can take. 

```cedar
namespace ProjectApp {
    entity User = {};

    entity Project = {};
    entity Task = {};
    entity TaskComment = {};
    entity Sprint = {};
    entity Epic = {};

    // Project actions
    action CreateProject appliesTo {
        principal: [User],
        resource: [Project]
    };
    action ViewProject appliesTo {
        principal: [User],
        resource: [Project]
    };
    action UpdateProject appliesTo {
        principal: [User],
        resource: [Project]
    };
    action DeleteProject appliesTo {
        principal: [User],
        resource: [Project]
    };

    // Task actions
    action CreateTask appliesTo {
        principal: [User],
        resource: [Task]
    };
    action ViewTask appliesTo {
        principal: [User],
        resource: [Task]
    };
    action UpdateTask appliesTo {
        principal: [User],
        resource: [Task]
    };
    action DeleteTask appliesTo {
        principal: [User],
        resource: [Task]
    };
    // ... omitted actions for TaskComment, Sprint, Epic
}
```

This will allow you to write more specific, more concise policies like:

```cedar
permit(
    principal == ProjectApp::User::"alice",
    action == ProjectApp::Action::"ViewProject",
    resource is ProjectApp::Project
);
```
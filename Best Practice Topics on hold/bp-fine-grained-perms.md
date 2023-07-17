---
layout: default
title: Design fine-grained permissions
parent: Best practices
nav_order: 10
---

# Design: Prefer fine-grained permissions in the model, broader permissions in the user interface
{: .no_toc }
One common regret in designing an application's authorization model is to start with very course-grained actions, such as `Read` and `Write`, and then retroactively realize that finer-grained actions are necessary. The need for finer-granularity can be driven by customer feedback for more granular access controls, or by compliance and security auditors who encourage least-privilege permissions.

If fine-grained permissions are not defined upfront, it can require a complicated migration to convert the application code and policy statements to use a different, finer-grained set of permissions. For example, application code that previously authorized against a course-grained action will need to be modified to use the fine-grained actions. In addition, policies must be updated to reflect the migration, for example:

```
permit (
    principal == User::"6688f676-1aa9-456a-acf4-228340b54e9d",
    action in [Action::"listFolderContents", Action::"viewFile"],
    //OLD - action with coarse-grained permissions
    //action == Action::"read",
    resource in Account::"c863f89b-461f-4fc2-b638-e5fa5f79a48b"
);
```

To avoid this costly migration, it is beneficial to define fine-grained permissions upfront. However, this presents another tradeoff if end-users are subsequently forced to understand a large number of fine-grained permissions, especially if most customers would be satisfied with course-grained controls such as `Read` and `Write`. To attain the best of both scenarios, fine-grained permissions can be aggregated into predefined groups such as `Read` and `Write` using mechanisms like policy templates or action groups. By using such mechanisms, customers can see the course-grained permissions. But, behind the scenes, the application is future-proofed by modeling the course-grained permissions as a collection of fine-grained actions. When either customers or auditors ask for it, the fine-grained permissions can be exposed.

As an example, the following schema snippet creates an action group that consists of multiple actions in a group called `security`.

```
"actions": {
    "unlock": {
        "memberOf": [ { "id": "security" } ]
    },
    "lock": {
        "memberOf": [ { "id": "security" } ]
    },
    "security": {}
}
```

You can then reference that group of `security` actions as a single element in a policy by using syntax like the following.

```
permit(
    principal,
    action in Action::"security",
    resource
);    

```
</section>

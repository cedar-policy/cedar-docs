---
layout: default
title: Permissions
nav_order: 3
---

# Best practice: Prefer fine-grained permissions in the model and aggregate permissions in the user interface

{: .no_toc }

One strategy that designers often regret later is designing an authorization model with very broad actions, such as Read and Write, and realizing later that finer-grained actions are necessary. The need for finer granularity can be driven by customer feedback for more granular access controls, or by compliance and security auditors who encourage least-privilege permissions.

If fine-grained permissions are not defined upfront, it can require a complicated conversion to modify the application code and policy statements to user finer grained permissions. For example, application code that previously authorized against a course-grained action will need to be modified to use the fine-grained actions. In addition, policies will need to be updated to reflect the migration:

```Cedar
permit (
    principal == User::"6688f676-1aa9-456a-acf4-228340b54e9d",
    // action  ==  Action::"read",              -- coarse-grained permission -- commented out
    action in [                       //        -- finer grained permissions
        Action::"listFolderContents", 
        Action::"viewFile"
    ],
    resource in Account::"c863f89b-461f-4fc2-b638-e5fa5f79a48b"
);
```

To avoid this costly migration, it's better to define fine-grained permissions upfront. However, this can result in a tradeoff if your end-users are subsequently forced to understand a larger number of fine-grained permissions, especially if most customers would be satisfied with course-grained controls such as `Read` and `Write`. To attain the best of both worlds, you can group fine-grained permissions into predefined collections such as `Read` and `Write` using mechanisms like policy templates or action groups. By using this approach, customers see only the course-grained permissions. But behind the scenes, you've future-proofed your application by modeling the course-grained permissions as a collection of fine-grained actions. When either customers or auditors ask for it, the fine-grained permissions can be exposed.

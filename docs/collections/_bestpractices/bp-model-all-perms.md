---
layout: default
title: Model all permissions in Cedar
nav_order: 4
---

# Best practice: Model all permissions in Cedar

{: .no_toc }

Before you started using Cedar you may have used a permissions table in your database that linked principal IDs to resource IDs. When moving to Cedar it's best practice to move all your permissions determination logic to Cedar policies. If you have a permissions table, each row of that table would become a separate Cedar policy.

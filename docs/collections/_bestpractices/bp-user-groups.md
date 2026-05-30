---
layout: default
title: Take advantage of user groups
nav_order: 6
---

# Best practice: Take advantage of user groups

{: .no_toc }

When creating your authorization model there might have been multiple user types created, such as `Admin`, `CustomerSupportTech`, `FinanceUser`, etc. In Cedar, we recommend only creating one user type, such as `User`, and creating [Groups](../overview/terminology.html#term-group) that map to the different kinds of users you have and control their permissions at the group level.

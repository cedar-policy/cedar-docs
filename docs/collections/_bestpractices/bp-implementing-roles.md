---
layout: default
title: Using role-based access control
nav_order: 7
has_children: true
---

# Best practice: Use role-based access control as part of your authorization strategy

{:toc}

This topic helps you to understand how to implement role-based access control (RBAC) by using Cedar. It describes the recommended approach of using principal groups to represent roles. This topic assumes that you are using Cedar with some sort of hosted policy store. This can be a policy store that you built, or that is part of a commercial product, such as Amazon Verified Permissions.

## What is a role?

We can define a *role* as a set of tasks that you assign to a person or thing (the principal) for a specific purpose. To perform those tasks, the principal needs permissions to perform the appropriate operations on the relevant resources. You express those permissions as Cedar policies.

* Roles are defined independently of the principals to which they are assigned.
* A principal can be assigned to many roles, or none at all.
* Assigning a role grants the assigned principal permission to do specific operations on specific resources.

## Modeling roles in Cedar by using groups

The recommended approach to modeling roles in Cedar is to use groups of principals to represent roles. You express the permissions for that role as one or more policies for that principal group. You then assign principals to the role by making them members of the group. You manage role assignment independently from the policy store, typically by using an identity provider (IdP).

For example, consider a timesheet management system that has two roles: (1) workers who submit timesheets and (2) approvers who approve the timesheets. A single individual can be assigned both roles. The following topics evaluate this scenario using the following strategies.

Using the recommended approach you would create groups for each of these there roles. So we’d have a `Worker` group, and an `Approver` group. Within the policy store we would create policies for each group.

The policy for the Approver role would look like this

```cedar
// Permits any member of the group Role::"Approver" to review and approve timesheets
permit (
    principal in Role::"Approver",
    action in [Action::"TimeSheetReview", Action::"TimeSheetApprove"],
    resource in TimesheetGrp::"all-timesheets"
);
```

Note that we’ve also created a resource group called  `TimesheetGrp::"all-timesheets"`  As the name suggests, all timesheets are members of this resource group.

We can simplify this policy a little bit, by creating an Action group. In this case we’d create an action group called `ApproverActions` , with the members `Action::"TimeSheetReview"`  and  `Action::"TimeSheetApprove"`.

We can now rewrite the policy as the following:

```cedar
// Permits any member of the group Role::"Approver" to review and approve timesheets
permit (
    principal in Role::"Approver",
    action in Action::"ApproverActions",
    resource in TimesheetGrp::"all-timesheets"
);
```

Action groups can be defined in your schema, so your application doesn’t need to pass action group memberships as part of the entity data of an authorization request. A benefit of Action groups is that you can now add another action to the Approver role by simply adding the new action to the definition of `Action::"ApproverActions"` in the schema. You do ***not*** have to update any of your policies.  
If we want to assign Joe to the role of Approver, we add him as a member of the group called `Role::"Approver"`.  That information needs to be tracked outside of the policy store, potentially in the IdP, or some other system of record. Assigning and unassigning principals to a role doesn’t require us to modify any policies.

When making an authorization request, we need to provide information about which groups the principal is in. For example, when asking whether `User::"Joe"` is permitted to take the action `TimeSheetReview`, we need to provide the authorization engine with the information that Joe is a member of the group `Role::"Approver"`.  

## Managing resource specific roles

So far, we’ve kept things very simple. A principal assigned to the Approver role can approve all timesheets. Things get more complicated when a role must be assigned for a specific subset of resources. For example, the timesheet-approver could be country specific. Bob might be authorized to approve timesheets in Germany and France, while Alice can approve timesheets in France and the UK.  

The following sections explore two different ways to do this. The first approach creates resource-specific roles. The second approach adds an attribute condition to the group policies. We assume that the are organized into resource groups per country.

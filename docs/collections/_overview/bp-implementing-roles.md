---
layout: default
title: Using role-based access control
parent: Best practices
nav_order: 7
has_children: true
---

# Best practice: Use role-based access control as part of your authorization strategy

{:toc}

This topic helps you to understand how to implement role-based access control (RBAC) by using Cedar. It describes the recommended approach of using principal groups to represent roles. It also covers an alternative approach that uses policy templates to represent roles. This topic assumes that you are using Cedar with some sort of hosted policy store. This can be a policy store that you built, or that is part of a commercial product, such as Amazon Verified Permission.

Role-based access control uses principal groups to represent roles, and models assignment of a role as membership in one of those groups. Cedar policies that example group membership can be further qualified by attribute-based conditions to enable finer grained permissions. This approach assumes that you have an IdP or some other system to manage identities and role assignments.

If this isn't the case, then you can use an alternative strategy of using policy templates to model roles. In this case, role assignment is represented as a template-linked policy attached to a specific principal, and possibly a specific resource group. While this approach negates the need for a separate system to manage role assignments, it tightly couples the policy store to user lifecycle management events, such as onboarding and termination, and therefore we don't recommended it as the primary choice.

## What is a role?

We can define a *role* as a set of tasks assigned to a person or thing (the principal) for a specific purpose. To perform those tasks, the principal needs permissions to perform certain operations on certain resources. You express those permissions as Cedar policies. 

* Roles are defined independently of the principals to which they are assigned.
* A principal can be assigned to many roles, or none at all.
* Assigning a role grants the assigned principal permission to do specific operations on specific resources.

Using this strategy results in two lifecycles to manage:

1. *Role management*: creating and deleting roles, and maintaining the permissions for each role
2. *Role assignment* : assigning and unassigning principals to these roles.

## Modeling roles in Cedar

There are two approaches to modeling roles in Cedar. The recommended approach uses groups of principals to represent roles. You express the permissions for that role as one or more policies that reference that principal group. You then assign principals to the role by making them members of the group. You manage role assignment separately from the policy store, typically by using an IdP.

An alternative approach uses policy templates. A role is represented as one or more policy templates that express the permissions for the role. A principal is assigned to the role by instantiating policies for that principal using the templates. In this approach role assignment is recorded within the policy store itself, and there is no need for a separate system of record to track who is assigned to which role.

We don't recommend this alternate approach because it creates a substantial policy management overhead; the policy store needs to be updated each time a user joins an organization, changes roles, or departs the organization.

For example, consider a timesheet management system that has two roles: (1) workers who submit timesheets and (2) approvers who approve the timesheets. A single individual can be assigned both roles. The following topics evaluate this scenario using the following strategies.

* [Role management using groups](#rbac-groups)
* [Role management using policy templates](#rbac-templates)

### Role management using groups<a name="rbac-groups"></a>

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

If we want to assign Joe to the role of Approver, we add him as a member of the group called `Role::"Approver"`.  That information needs to be tracked outside of the policy store, potentially in the identity pProvider. Assigning and unassigning principals to a role doesn’t require us to modify any policies. 

When making an authorization request, we need to provide information about which groups the principal is in. For example, when asking whether `User::"Joe"` is permitted to take the action `TimeSheetReview`, we need to provide the authorization engine with the information that Joe is a member of the group `Role::"Approver"`.  

You can assign a principal to multiple roles by adding them as members of multiple groups.

### Role management using policy templates <a name="rbac-templates"></a>

Using the alternative approach we would create a template for each of these there roles. So we’d have a `Worker` template and an `Approver` template. 

The template for the Approver role would look like this.

```cedar
// Time-sheet-approver role template
permit (
    principal == ?principal,
    action in Action::"ApproverActions",
    resource in TimesheetGrp::"all-timesheets"
);
```

We can then assign Joe and Katie to this role by creating template-linked policies using this template. 
Each template-linked policy is specific to an individual principal.

```cedar
// Policy for Joe linked to time-sheet-approver template 
permit (
    principal == User::"Joe",
    action in Action::"ApproverActions",
    resource in TimesheetGrp::"all-timesheets"
);
```

```cedar
// Policy for Katie linked to time-sheet-approver template 
permit (
    principal == User::"Katie",
    action in Action::"ApproverActions",
    resource in TimesheetGrp::"all-timesheets"
);
```

You can assign multiple roles to a by creating multiple template-linked policies for that principal. 

### An initial comparison of the two approaches

If you have an identiy provider or other system to manage role assignments then the recommended approach is to use groups to model roles.

If you don’t have a system to manage role assignment, then role management using templates can be an option, however there are some factors that you’ll need to consider. 

First, by using the template approach, your policy store is now tightly coupled to the life-cycle management of your users. When you on-board a new user and assign them to a role, you must create template-linked policies for them. When that user changes role, you must find those policies, archive them, and then create new template-linked policies. When the user leaves the organization, you must archive the policies for that user. If you simply delete the policies, rather than archiving them, then you lose the historical record of who was permitted to do what, which might be required for forensics purposes. 

These challenges compound, if the role is a complex set of permissions requiring multiple policies.  In the simple example above, the permissions for the role can be expressed as a single policy statement. Therefor, assigning a principal requires the creation of a single template-linked policy. However more complex roles might require several policies to express the permissions. In that case, the assignment and unassignment processes become more burdensome, as you must create or delete multiple template-linked policies.

## Managing resource specific roles 

In the previous examples, we’ve kept things very simple. A principal assigned to the Approver role can approve all timesheets. Things get more complicated when a role must be assigned for a specific subset of resources. For example, the timesheet-approver could be country specific. Bob might be authorized to approve timesheets in Germany and France, while Alice can approve timesheets in France and the UK.  

The following sections explore the pros and cons of the group and template approaches for this more complicated scenario. For this we assume that the are now organized into resource groups per country. We also break down the approach using groups into two categories, where the second category shows how to use attributes attached to the principals and resources to provide additional flexibility and finer-grained permissions.

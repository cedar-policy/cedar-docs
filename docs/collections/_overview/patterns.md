---
layout: default
title: Design patterns
nav_order: 4
---

# Cedar design patterns {#patterns}
{: .no_toc }

Once you understand the basics of the Cedar policy language, you can start to design policies for your application’s permissions model. The most commonly used terms in authorization are:

+ *Role Based Access Control (RBAC)* - Permissions are based on role assignments
+ *Attribute Based Access Control (ABAC)* - Permissions are based on attribute values of the user and/or the resources
+ *Relationship Based Access Control (ReBAC)* - Permissions are based on a relationship between the user and the resource.

These terms can be a helpful starting point, for understanding different permissions models, but can introduce some confusing overlaps. For example, Owner can be seen as a role, but also a relationship between a user and a document; and that relationship may be stored as an attribute of the document.  

This topic introduces three Cedar design patterns:

1. [Membership permissions](#membership) are derived from the principal’s membership of one or more groups. Access is granted by making a principal a member of a group. This pattern is commonly used to implement Role Based Access Control (RBAC), where the role is represented as a group.  Group membership is stored and managed independently of the policies, for example in an Identity Provider. Management of group membership often happens without reference to particular sets of resources. For example, an employee is assigned the role of compliance officer, thereby enabling her to sign off all audits. 

2. [Relationship permissions](#relationship) are derived from a relationship between the principal and a resource. This pattern maps directly to ReBAC. Relationships are stored and managed independently of the policies, for example in the application database. Cedar policies describe the actions that a principal is permitted to take on a resource, based on the relationship type. Relationship permissions are often more fine-grained than membership permissions, because they are defined at the level of individual resources. For example, suppose an employee is made the owner of a document summarizing the findings of an audit. This is modeled as the employee having an ‘owner relationship’  with this document. A Cedar policy might state that this relation permits the employee to edit this audit document (but not any other audit document). 

3. [Discretionary permissions](#discretionary) are granted on an ad hoc basis, at the discretion of an administrator, developer, or other authority. A discretionary policy is always scoped to a specific principal. Whereas a membership permission says “you are a member of this group/role and therefore you can do these things”, and a relationship permission says “you have this relationship with this resource and therefore you can do these things with this resource”, a discretionary permission simply says “you can do these things” because someone with authority created this policy. This pattern stores fine grained permissions as individual policies attached to specific principals. 

Each of these policy design patterns can use ABAC conditions to further constrain access based on attributes of the principal or the resource.  

<details open markdown="block" id="toc">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

## Discretionary permissions in Cedar {#discretionary}

Discretionary permissions are granted on an ad hoc basis at the discretion of an administrator, developer, or other user with the authority to grant access to a resource or group of resources. Policies expressing discretionary permissions apply to a specific principal which is identified in the scope of the policy, i.e., the scope starts with principal == .

One use of discretionary permissions is for machine to machine authorization, where a security admin is defining a set of access rules describing which service can call which other service. 

For example:
```cedar
permit (
  principal == Service::"Service-1343",
  action == Action::"ServiceRequest",
  resource == Service::"Service-7465");
   
permit (
  principal == Service::"Service-9352",
  action == Action::"ServiceRequest",
  resource == Service::"Service-7465");
  
 permit (
  principal == Service::"Service-9352",
  action == Action::"ServiceRequest",
  resource == Service::"Service-2851");
  ```

While a discretionary policy always references an individual principal, its resource scope can refer to a group of resources. 

For example:
```cedar
permit (
  principal == Service::"Service-1343",
  action == Action::"ServiceRequest",
  resource in ServiceGroup::"ServiceGroup-AA44");
  ```

If the application creates discretionary permissions at run time, the best practice is to use templates to define the shape of the policy, and have the application create a template-linked policy by providing IDs for the principal and the resource. 

For example, a ticket management system allows a service agent to share access to an open ticket with another user. To do this in Cedar, create a policy template as shown below. Each time an agent shares access to a ticket, the application creates a template-linked policy, populating the ID of the User with whom the ticket is being shared, and the ID of the ticket itself.
```cedar
// Template for ticket sharing
permit (
  principal == ?principal,
  action in Action::"Shared_TicketAccess",
  resource == ?resource) 
 when {
    resource.status == "OPEN" 
 } ;
  ```
The discretionary pattern works well for granting ad-hoc permissions from within an application, as in the ticket sharing example.

The discretionary pattern can scale to grant a single set of permissions to multiple individual users. Using templates enables policy managers to add additional conditions to these policies, by modifying the template. 

However, many organizations prefer to grant permissions to a group of users or a role. Users assigned to the group or role then inherit these permissions. For more information about doing this, see [Membership permissions in Cedar](#membership).\
\
[Back to topic list](#toc)

## Membership permissions in Cedar {#membership} 
This pattern uses Cedar policies to describe what members of a group are permitted to do. A user is granted these permissions by making them a member of the group. Group membership is stored and managed independently of the policies, for example in an Identity Provider. 

Membership permissions are commonly used to implement Role Based Access Control (RBAC). For example, we can write a Cedar policy stating that members of the ContractManager role are permitted to review and execute contracts. 
```cedar
permit ( 
  principal in Role::"ContractManager", 
   action in [Action::"reviewContract", Action::"executeContract"],
   resource
); 
```

When `Employee ::“Alice”` is promoted and made a member of `Role::"ContractManager"`, this policy permits her to review and execute contracts. The policy is not specific to Alice. It applies to all members of the role.

Note that `Role` is not a reserved term in Cedar. In this example, `Role` is an entity type, defined in the schema, such that entities of type `Employee` can be members of entities of type `Role`. `ContractManager` is an entity of type `Role`.

Membership permissions can also be used to define permissions for groups of users, such as teams and departments. For example, the following policy states that any principal in the Finance team can review and approve budgets.
```cedar
permit ( 
  principal in Team::"Finance", 
   action in [Action::"reviewBudget", Action::"approveBudget"],
   resource 
); 
```
When Bob joins the Finance team, we model this by adding `Employee::"Bob"` to the group representing the Finance team. This membership is recorded outside of the policy store, for example in an Identity Provider. The policy now applies to Bob and he can review and approve budgets.

### Adding constraints using attribute-based conditions {#membership-constraints}

The policies in the previous examples permit any principal in the scoped group to take the scoped actions on any resource. In some cases we may want to place constraints on the resources that members of the group can act on. For example, the Finance team may only be able to approve budgets below $25K. We model this constraint by adding a fixed attribute-based condition to the finance group membership policy. 
```cedar
permit ( 
  principal in Team::"Finance", 
   action in [Action::"reviewBudget", Action::"approveBudget"],
   resource
) when {
 resource.value < 25000 
}; 
```


This policy states that any principal in the Finance team can review and approve budgets with a value less than 25000. Note that the policy references an attribute called `value` on the `Budget` entity.

With the previous policy, the limit applies to all members of the Finance Team. The attribute condition is independent of the principal. However, in some cases, different members of the team may have different budget approval limits. One approach to modelling this would be to use the discretionary design pattern. With this approach, the group level policy in the previous example would be replaced by individual policies, one for each team member. An alternate approach is to store each team members limit as a principal attribute, and then reference that within a condition of the policy.
```cedar
permit ( 
  principal in Team::"Finance", 
   action in [Action::"reviewBudget", Action::"approveBudget"],
   resource 
) when {
 resource.value <= principal.budgetApprovalLimit
}; 
```
### Using attribute conditions to prevent role explosion {#membership-prevent-explosion}

In some cases we need to assign a role on a specific set of resources. For example, Alice may be assigned the role of Compliance Officer for the countries of Canada and the United States. This allows her to sign off audits at manufacturing sites in these two countries.

One approach would be to use the discretionary design pattern and create country-specific policy templates for `Compliance Officers`. In Alice's case, we would then create two template-linked policies, one using the `Canada` template and the other using the `United States` template. 

Another approach would be to create a compliance officer role for each country. In Cedar terms `Employee::"Alice"` would be a member of `Role::"ComplianceOfficerCanada"` and `Role::"ComplianceOfficerUSA"`. 

If we group audits by country then we can create a membership policy for each country as shown in the following:
```cedar
permit ( 
  principal in Role::"ComplianceOfficerCanada", 
   action in [Action::"approveAudit"],
   resource in AuditGroup::"AUDITS_CANADA"
) ;

permit ( 
  principal in Role::"ComplianceOfficerUSA", 
  action in [Action::"approveAudit"],
  resource in AuditGroup::"AUDITS_USA"
) ;
```

However, this approach may not scale well, leading to an explosion in the number of roles the organization has to manage if they operate in many countries. 

A third approach is to create a role-associated attribute. This is an attribute on the principal that is specific to the role, and captures the constraint for the role assignment. The value of this attribute is set at time of assignment. For the sake of clarity, it’s best to name the attribute after the role. In the previous example we might define an attribute for the employee entity called 'complianceOfficerCountries', which contains the set of countries in which the employee has jurisdiction as a compliance officer. We can now write a single policy, constrained by this attribute.
```cedar
permit ( 
  principal in Role::"ComplianceOfficer", 
   action in [Action::"approveAudit"],
   resource is Audit) 
when {
 principal has complianceOfficerCountries &&
 resource.country in principal.complianceOfficerCountries 
}; 
```

If Alice’s remit as a compliance officer is extended to include Mexico, then we add this country to Alice’s set of countries as defined by `complianceOfficerCountries`. This pattern enables the rule to be expressed as a single policy, however it does require the maintenance of an additional authorization attribute outside of the policy store.\
\
[Back to topic list](#toc)

## Relationship permissions in Cedar {#relationship}

In contrast to membership permissions, relationship permissions are granted based on a relationship between the principal and a resource or group of resources. The relationship itself is stored and managed outside of the Cedar policy store. We can use Cedar to write policies that describe what actions a resource is permitted to take, based on that relationship. This is called Relationship Based Access Control (ReBAC).

To illustrate relationship permissions we will use an example application called TinyToDo. Users of the TinyToDo can create and manage task lists, and share these lists with other users. We model this as users having relationships with these lists. The creator of the task list has an **owner** relationship with the list which grants the creator full permissions. We can refer to these permissions as the `ownerActions`, i.e. the set of actions that a user with the **owner** relationship is permitted to take on a task list. Other relationships might be **contributor**, which grants permission for a user to take a set of `contributorActions`; and **viewer**, which grants permission for a user to take a set of `viewerActions`. 

In Cedar, a relationship is modeled using an attribute on the resource. Each relationship gets its own attribute, which contains the set of users that have that relationship with that resource. The name of the attribute should be named after the relationship. For example, the set of principals with the **owner** relationship would be contained in an `owners` attribute. This enables us to write Cedar policies with conditional constraints based on these attributes, as shown in the following policy:
```cedar
// Owners policy
permit (
  principal is User,
  action in Action::"ownerActions",
  resource is List) 
when {
  principal in resource.owners
};  

// Contributors policy
permit (
  principal is User,
  action in Action::"contributorActions",
  resource is List) 
when {
  principal in resource.contributingUsers
};  

// Viewer policy
permit (
  principal is User,
  action in Action::"viewerActions",
  resource is List) 
when {
  principal in resource.viewingUsers
};  
```

Note that with relationship permissions, the policy scope typically only defines the type of the principal. You can add additional constraints on the principal or resource using attribute conditions, as in the following examples:
```cedar
// Contributors policy, disallowed for terminated users
permit (
  principal is User,
  action in Action::"contributorActions",
  resource is List) 
when {
  resource has contributingUsers && principal in resource.contributingUsers
}
unless {
  principal has isTerminated && principal.isTerminated
};  

// Viewer policy, constrained for private resources
permit (
  principal is User,
  action in Action::"viewerActions",
  resource is List) 
when {
  resource has viewingUsers && principal in resource.viewingUsers 
}
unless { 
  resource has isPrivate and resource.isPrivate 
};
```

In examples we’ve looked at so far, the relationship (**owner**, **contributor**, **viewer**) is between the resource and an individual user. In some cases the relationship might be established between the resource and a group of principals. 

For example, TinyTodo lets an administrator set up teams. List owners can then make those teams contributors to lists. This can be modeled in Cedar by adding a second attribute for the contributor relationship, which holds the set of user groups with this relationship. The contributors policy can then be extended as shown in the following example:
```cedar
// Contributors policy for Users and user groups, disallowed for terminated principals
permit (
  principal is User,
  action in Action::"contributorActions",
  resource is List) 
when {
  ( resource has contributingUsers && principal in resource.contributingUsers ) ||
  ( resource has contributingTeams && principal in resource.contributingTeams ) 
}
unless {
  principal has isTerminated && principal.isTerminated
};
```
[Back to topic list](#toc)

## Mixing different permission types {#mixing-permissiona}

Individual policies should follow either the [membership](#membership), [relationship](#relationship) or [discretionary](#discretionary) design pattern. Single policies that combine these patterns are at best confusing and at worst error prone. However, you can mix policies of different types in the same policy store. One of the strengths of Cedar is it allows you to do this without compromising on readability, performance or correctness. 

For example, the Tiny ToDo application, which was used in as the example for relationship permissions, might also (1) have an admin role which grants full permissions on all lists within the application; (2) grant users the permission to mark lists as public, thereby permitting any user to view the list; and (3) have a housekeeping daemon that deletes old lists. 

Building your permissions model using Cedar makes it easy to allow this, by adding two membership based policies and a discretionary policy to the store
```cedar
// admin role policy - membership based
permit (
  principal in Role::"Admin",
  action in Action::"adminActions",
  resource is List);
  
// public access policy - constrained membership 
permit ( 
  principal in UserGroup::"rootUserGroup", 
  action in [Action::"viewList"]
  resource is List ) 
when {
 resource has isPublic && resource.isPublic
} ; 

// housekeeping policy - discretionary
permit (
  principal == daemon::"housekeeping",
  action in Action::"housekeepingActions",
  resource is List);
```
[Back to topic list](#toc)

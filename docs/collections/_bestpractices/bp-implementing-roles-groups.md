---
layout: default
parent: Using role-based access control
title: Groups and resource-specific roles
nav_order: 1
has_children: false
---

# RBAC with groups and resource-specific roles

We can extend the ‘role management using groups’ approach, and create a separate approver group for each set of resources: `Approver-France`, `Approver-Germany`, and `Approver-UK`.

Each role is represented by a policy in the policy store, as  shown in the example below.

```cedar
// Role to approve French timesheets
permit (
    principal in Role::"Approver-France",
    action in Action::"ApproverActions",
    resource in TimesheetGrp::"French-timesheets"
);
```

```cedar
// Role to approve German timesheets
permit (
    principal in Role::"Approver-Germany",
    action in Action::"ApproverActions",
    resource in TimesheetGrp::"German-timesheets"
);
```

```cedar
// Role to approve UK timesheets
permit (
    principal in Role::"Approver-UK",
    action in Action::"ApproverActions",
    resource in TimesheetGrp::"UK-timesheets"
);
```

## Assigning a User to a Role

An administrator can assign a user to the role by adding them as a member of the associated group. For example, Bob is a member of groups `Approver-France` and `Approver-Germany`. Alice is a member of groups `Approver-France` and `Approver-UK`.

The policy store isn't maintaining a record of which roles a user is assigned to, such as which groups a principal is a member of. You must keep track of this using a system separate from Cedar, such as your IdP.

## Making an Authorization Request

Consider an application using Cedar policies in the Amazon Verified Permssions service. The application needs to call the [`IsAuthorized`](https://docs.aws.amazon.com/verifiedpermissions/latest/apireference/API_IsAuthorized.html) operation, passing through [`entities`](https://docs.aws.amazon.com/verifiedpermissions/latest/apireference/API_IsAuthorized.html#verifiedpermissions-IsAuthorized-request-entities) data that describes the principal’s group memberships and the resource’s group memberships.

For example, an authorization request to determine whether Alice can approve JeanPaul’s timesheet must include the following:

* The list of groups that the principal Alice is a member of.
* The list of groups that resource JeanPaul’s timesheet is a member of.

If you are building your own authorization engine, using the Cedar SDK, then you must also pass all relevant policies, as part of the request. If you are using a hosted service, such as Amazon Verified Permissions, then the service can select the relevant policies for evaluation from its policy store.

## Expanding to a new country

Adding a new country requires you to create of a new group in the IdP to represent the country specific role, and to add a new policy for that group.

For example, to expand into Japan, you might create a new user group called `Approver-Japan` and a new policy that references that group. This policy permits members of that group to approve only Japanese timesheets.

```cedar
// Role policy to approve Japanese timesheets
permit (
    principal in Role::"Approver-Japan",
    action in Action::"ApproverActions",
    resource in TimesheetGrp::"Japanese-timesheets"
);
```
For more information, see [Manage roles and entitlements with PBAC using Amazon Verified Permissions](https://aws.amazon.com/blogs/devops/manage-roles-and-entitlements-with-pbac-using-amazon-verified-permissions/) on the _AWS DevOps Blog_. 

To see a sample application, see [avp-petstore-sample-v2](https://github.com/aws-samples/avp-petstore-sample-v2) on _GitHub_.

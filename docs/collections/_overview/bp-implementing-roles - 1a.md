---
layout: default
grand_parent: Best practices
parent: Using role-based access control
title: RBAC with groups
nav_order: 1
has_children: false
---

# Approach 1a - Role management using groups with resource-specific roles

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

Consider an application using Cedar policy in the Amazon Verified Permssions service. The application needs to call [`IsAuthorized`](https://docs.aws.amazon.com/verifiedpermissions/latest/apireference/API_IsAuthorized.html) operation, passing through [`entities`](https://docs.aws.amazon.com/verifiedpermissions/latest/apireference/API_IsAuthorized.html#verifiedpermissions-IsAuthorized-request-entities) data that describes the principal’s group memberships and the resource’s group memberships. 

For example, an authorization request to determine whether Alice can approve JeanPaul’s timesheet must include the following:

* The list of groups that the principal Alice is a member of. 
* The list of groups that resource JeanPaul’s timesheet is a member of.

If you are building your own authorization engine, using the Cedar SDK, then you must also pass all relevant policies, as part of the request. If you are using a hosted service, such as Amazon Verified Permissions, then the service can select the relevant policies for evaluation from its policy store.

The following is a sample authorization request for Amazon Verified Permissions that uses the [IsAuthorized](https://docs.aws.amazon.com/verifiedpermissions/latest/apireference/API_IsAuthorized.html) operation to illustrate the previous scenario.

```
isAuthorized (
    principal = "User::Alice",
    action = Action::"TimeSheetApprove",
    resource = TimeSheet::"JeanPaul-230331",
    sliceComplement = {
        Entities = [
            {
                Identifier: { 
                    EntityId: "Alice", 
                    EntityType:"User"
                },
                #Each group that Alice is part of is a parent. 
                Parents: [ 
                    { 
                        EntityId: "Approver-France", 
                        EntityType: "Role" 
                    },
                    { 
                        EntityId: "Approver-UK", 
                        EntityType: "Role" 
                    }  
                ]  
            },
            {
                Identifier:{ 
                    EntityId: "JeanPaul-230331", 
                    EntityType:"TimeSheet"
                },
                #Each group that the resource is a member of 
                { 
                    EntityId: "France", 
                    EntityType: "TimesheetGrp" 
                }
            }
        
        ]
    }
)
```

## Expanding to a new country

Adding a new country requires you to create of a new group in the IdP to represent the country specific role, and to add a new policy for that group. 

For example, to expand into Japan, you might create a new user group called `Approver-Japan` and a new policy that references that group. This policy permits members of that group to approve only Japanese timesheets. 

```
# Role policy to approve Japanese timesheets
permit (
         principal in Role::"Approver-Japan",
         action in Action::"ApproverActions",
         resource in TimesheetGrp::"Japanese-timesheets"
);
```

## Listing All Users assigned a Role

You can list all of the users who are assigned to a role by querying your IdP. For example, you can list users in a group in Amazon Cognito by calling the [`ListUsersInGroup`](https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_ListUsersInGroup.html) API. The policy store you develop for your application typically doesn't have access to this information. 


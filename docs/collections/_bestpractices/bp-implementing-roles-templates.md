---
layout: default
parent: Using role-based access control
title: Roles with policy templates
nav_order: 3
has_children: false
---

# Role management using policy templates 

The recommended approach to implementing role-based access control in Cedar is to use principal groups to represent the roles. However, this requires a system of record, such as an identity provider (IdP), to keep track of which users are assigned to which roles. If this isn't an option, then you can manage role assignment within your policy store by using policy templates.

Using this approach, you create a template for each of the roles. So, continuing with the timesheet example from the previous sections, you create we’d have a Worker template and an Approver template. 

```
# Approver-Role-Assignment policy template 
permit ( 
    principal == ?principal, 
    action in Action::"ApproverActions", 
    resource in ?resource 
)
```

## Assigning a role to a user

In this approach, it is the policy store that keeps track of which roles a user is assigned to. To assign a user to a role, we must instantiate a template-linked policy that links the specific user and resource group. For example, to assign Alice to the approver role for France and the UK, we create two template-linked policies from the role template.

```
createPolicy ( 
    template = "Approver-Role-assignment", 
    principal = User::"Alice", 
    resource = TimesheetGrp::"UK" 
)
```

```
createPolicy (
    template = "Approver-Role-assignment", 
    principal = User::"Alice", 
    resource = TimesheetGrp::"France" 
)
```

You can see that each template-linked policy grants permissions to a specified user to perform the actions in the template on the specified resources in the resource group.


## Making an authorization request

The entity data within the authorization request must include the group membership of the resource. However, this approach doesn’t need to include group memberships of the principal, because we created a separate template-linked policy for each assigned principal.
<!---
```
// Authorization request 
isAuthorized ( 
    principal = "User::Alice", 
    action = Action::"TimeSheetApprove", 
    resource = TimeSheet::"JeanPaul-230331", 
    sliceComplement = { 
        Entities = [
            { 
                Identifier: {
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

```-->

## Expanding to a new country

To create an approver role for a new country doesn't require the addition of a new user group in the IdP, or the creation of a new policy or template. The only configuration activity required is the creation of a new resource group to contain the resources for that country. For example, when the company expands into Japan it must add a new resource group called `TimesheetGrp::"Japanese-timesheets"`.

## Considerations when using templates

If you use the template approach, you tightly couple the policy store to the life-cycle management of your users. When you on-board a new user and assign them to a role, you must create template-linked policies for them. When that user changes roles, you must find those policies, archive them, and then create new template-linked policies. When the user leaves the organization, you must archive the policies for that user. If you simply delete the policies, rather than archiving them, then you lose the historical record of who was permitted to do what, which might be required for forensics purposes. 

These challenges compound, if the role is a complex set of permissions requiring multiple policies. In the simple example above, the permissions for the role can be expressed as a single policy statement. Therefore, assigning a principal requires the creation of a single template-linked policy. However more complex roles might require several policies to express the permissions. In that case, the assignment and unassignment processes can become more burdensome, as you must create or delete multiple template-linked policies.
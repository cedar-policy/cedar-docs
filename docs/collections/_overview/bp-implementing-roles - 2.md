---
layout: default
grand_parent: Best practices
parent: Using role-based access control
title: RBAC with templates
nav_order: 3
has_children: false
---

# Approach 2 - Role management using policy templates

An alternative to using groups relies on [policy templates](policies/templates.html) to define roles, and creating template-linked policies to manage role assignments.  The application developer defines a policy template to represent the role. The template itself is not specific to a country. 

```
# Approver-Role-Assignment policy template
permit (
         principal == ?principal,
         action in Action::"ApproverActions",
         resource in ?resource
)
```

Note that this template is similar to the one that we originally looked at in the simplistic example, except that there is now also a placeholder for the resource.

## Assigning a role to a user

In this approach it is the policy store that keeps track of which roles a user is assigned to. Assigning a user to a role involves creating a template-linked policy for the specific user and another template-linked policy for the specific resource group. For example, when assigning Alice the approver role for France and the UK we create two policies using this template.

```
createPolicy (
       template = "Approver-Role-assignment",
       principal = User::"Alice",
       resource = TimesheetGrp::"UK"
)

createPolicy (
       template = "Approver-Role-assignment",
       principal = User::"Alice",
       resource = TimesheetGrp::"France"
)
```

You can see that each template-linked policy grants permissions to a specified user to perform the actions in the template on the specified resources in the resource group. Note that the `resource` line in the template uses the [`in`](policies/syntax-operators.html#in-hierarchy-membership) operator to check for membership in a resource group instead of matching only an individual resource.

## Making an Authorization Request

Similar to the Approach 1, the entity data within the authorization request must include the group membership of the resource.  Unlike Approach 1 however, this approach doesn't need to include the group memberships of the principal, because we’ve created a separate template-linked policy for each assigned principal.    

```
// Authorization request using approach 2

isAuthorized (
    principal = "User::Alice",
    action = Action::"TimeSheetApprove",
    resource = TimeSheet::"JeanPaul-230331",
    sliceComplement = {
        Entities = [
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
        ]  
    }
)
```

## Expanding to a new country

To create an approver role for a new country does not require the addition of a new user group in the IdP, or the creation of a new policy or template in AVP. The only configuration activity required is the creation of a new resource group to contain the resources for that country. For example, when the company expands into Japan it must add a new resource group called `TimesheetGrp::"Japanese-timesheets"`.

## Listing all users assigned to a role

If your policy store lets you list the policies for a specific user and template then you can figure out who is assigned to what role by parsing the result set of that query. 

For example, using Amazon Verified Permissions, you can call the [`ListPolicies`](https://docs.aws.amazon.com/verifiedpermissions/latest/apireference/API_ListPolicies.html) operation to return all policies, representing Approver-role assignments, and filter the results based on the template-ID.  

```
ListPolicies (
    Filter: {
        PolicyTemplateId: "Approver-Role-assignment"
    }
)
```

You could also refine your search to return only those users who can approve French time sheets by also filtering the resource to include only those policies that reference the specified group.

```
ListPolicies (
    Filter: {
        PolicyTemplateId: "Approver-Role-assignment"
        resource : TimesheetGrp::"France" 
    }
)
```

---
layout: default
grand_parent: Best practices
parent: Using role-based access control
title: RBAC recommendations
nav_order: 4
has_children: false
---

# Recommendations for managing resource specific roles

Because it usually results in a simpler strategy, we recommend that you model roles using groups. 

If you are already organizing your roles into groups based on which resources they can act on, as in the example of country level approvers, and you are comfortable with the way that group membership is managed, then we recommend Approach 1a: “Role management using groups, with resource specific roles”.

The risk when using this approach is role explosion. It works if the number of roles is limited and isn't expected to grow much. Today you might have ten resource groups, with ten associated principal groups, and it feels very manageable. However, if you have a lot more resource groups in your future, and therefore a lot more principal groups that you are going to need to manage, then this approach might not scale. 

If your roles are expected to grow in number significantly, then Approach 1b: “Role management using groups - with attributes-based conditions” might be the better approach for you. If you are already maintaining attributes on users and resources that you can match in a policy condition, such as in the `principal.assignedProjects` attribute, then this approach can provide an elegant solution.  Even if you are not fortunate enough to have exactly that attribute, your application might still be able to programmatically derive that value relatively easily in real time prior to making the authorization request, and present it as an attribute within the entity data. 

If you are not already maintaining a record, outside of your policy store, of which users are assigned to which resource sets, and your application can’t make that determination in real time, then Approach 2: “Role management using templates” might be the best optiion for you. This approach stores the assignment of the user to the role for a specific resource group by linking a policy template to the specified principal and resource using a template-linked policy. However, this approach tightly couples the policy store to the user management lifecycle. Lifecycle events operations such as on-boarding or terminating a user, or reassigning them to a new role require that you update policies in your store. 


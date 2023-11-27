---
layout: default
title: Policy templates
nav_order: 8
---

# Cedar policy templates {#templates}
{: .no_toc }

A policy template is a policy that contains *placeholders*. The placeholders can represent the principal and the resource. Later, you can create a template-linked policy based on the policy template by specifying the exact principal and resource to use for this one policy. Template-linked policies are dynamic, meaning that the new policy stays linked to its policy template. When you change a policy statement in the policy template, any policies linked to that template automatically and immediately use the new statement for all authorization decisions made from that moment forward.

You can use placeholders in a Cedar policy template for only the following two elements of a policy statement:

+ Principal – `?principal`
+ Resource – `?resource`

You can use either one or both in a policy template.

Placeholders can appear in ***only*** the policy head on the right-hand side of the `==` or `in` operators.
This includes `in` operators when appearing together with an `is` operator, but excludes solitary `is` operators.

Then, when you create a policy based on the policy template, you must specify values for each of the placeholders. Those values are combined with the rest of the policy template to form a complete and usable template-linked policy.

As an example, consider the scenario where a common action is to grant certain groups with the ability to view and comment on any photos that are not marked as `private`. You decide to associate the action with a **Share** button in your application's interface. You could create a template that looks like the following example.

```cedar
permit (
  principal in ?principal,
  action in [Action::"view", Action::"comment"], 
  resource in ?resource
)
unless {
  resource.tag =="private"
};
```

When a user chooses **Share**, your application instantiates that policy template into an individual template-linked policy. The template-linked policy references the policy template and specifies values for the placeholders. For example, a user chooses to share their `vacationTrip` album with their `friendsAndFamilies` group. Choosing **Share** in your application starts the creation of a template-linked policy that specifies `UserGroup::"friendsAndFamily"` as the principal and `Album::"vacationTrip"` as the resource. This template-linked policy behaves exactly as if it were written like the following static policy.

```cedar
permit (
  principal in UserGroup::"friendsAndFamily",
  action in [Action::"view", Action::"comment"], 
  resource in Album::"vacationTrip"
)
unless {
  resource.tag =="private"
};
```

However, the new policy isn't actually constructed as a static policy with that policy statement. Instead, the new policy is a template-linked policy that dynamically links the policy template with those two specific placeholder values. Later, you might choose to modify the policy template, such as by adding an additional condition to the `unless` clause. From that moment on the change immediately affects all authorization decision results for all template-linked policies created from the modified policy template.

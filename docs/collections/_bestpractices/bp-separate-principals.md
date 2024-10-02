---
layout: default
title: Separate principals & containers
nav_order: 6
---

# Best practice: Separate the principals from the resource containers
{: .no_toc }

When you are designing a resource hierarchy, one of the common inclinations, especially for consumer-facing applications, is to use the customer's user identity as the container for resources within a customer account.

![\[Illustrates the structure of contaier where the user ID is the container.\]](images/separate-principals-from-resources.png)

We recommend that you treat this strategy as an anti-pattern. This is because there is a natural tendency in richer applications to delegate access to additional users. For example, you might choose to introduce "family" accounts, where other users can share account resources. Similarly, enterprise customers sometimes want to designate multiple members of the workforce as operators for portions of the account. You might also need to transfer ownership of an account to a different user, or merge the resources of multiple accounts together.

When a user identity is used as the resource container for an account, the previous scenarios become more difficult to achieve. More alarming, if others are granted access to the account container in this approach, they might inadvertently be granted access to modify the user identity itself, such as changing Jane’s email or login credentials.

Therefore, when possible to do so, a more resilient approach is to separate the principals from the resource containers, and model the connection between them by using concepts such as "admin permissions" or "ownership".

![\[Illustrates the structure of contaier where the user ID is separated from the container.\]](images/separate-principals-from-resources-2.png)

Where you have an existing application that is unable to pursue this decoupled model, we recommend that you consider mimicking it as much as possible when designing an authorization model. For example, an application that possesses only a single concept named `Customer` that encapsulates the user identity, login credentials, and resources that they own, could map this to an authorization model that contains one logical entity for `Customer Identity` (containing name, email, etc) and a separate logical entity for `Customer Resources` or `Customer Account`, acting as the parent node for all the resources they own. Both entities can share the same `Id`, but with a different `Type`.

![\[Illustrates the structure of contaier where the user ID is contained in a customer identity.\]](images/separate-principals-from-resources-3.png)

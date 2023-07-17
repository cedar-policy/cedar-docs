---
layout: default
title: Separate principals from resources
parent: Best practices
nav_order: 6
---

# Design: Separate the principals from the resource containers

{: .no_toc }

When designing a resource hierarchy, one of the common inclinations (especially for consumer-facing applications) is to use the customer identity as the container for resources within a customer account.

<!--![\[Sample hierarchy resources contained by a principal.\]](<img  width="60%" src="images/separate-principals-from-resources.png"/>)-->

![\[Sample hierarchy resources contained by a principal.\]](images/separate-principals-from-resources.png)

This tends to be an anti-pattern as applications grow larger and more complex. This is because there is a natural tendency in richer applications to delegate access to additional users. Such a need may arise with the introduction of family accounts, for example, where other users can share account resources. Or, with enterprise customers who wish to designate multiple members of the workforce who can operate portions of the account. Alternatively, customers may want to transfer ownership of an account to a different user, or merge the resources of multiple accounts together.

When a user identity acts as the account container, it can make these scenarios difficult to achieve. More alarming, if others are granted access to the account container in this approach, they may inadvertently be granted access to modify the user identity itself, such as changing Jane’s email or login credentials.

Therefore, when possible to do so, a more resilient approach is to separate the principals from the resource containers, and model the connection between them via concepts such as “admin permissions” or “ownership”.

<!--![\[Principals are separate from accounts that contain resources.\]](<img width="80%" src="images/separate-principals-from-resources-2.png">)/>-->

![\[Principals are separate from accounts that contain resources.\]](images/separate-principals-from-resources-2.png)

For existing applications that are unable to pursue this decoupled model, we recommend that you consider mimicking it as much as possible when designing an authorization model. For example, an application that possesses only a single concept named `Customer` which encapsulates the user identity, login credentials, and the resources they own, could map this to an authorization model that contains one logical entity for `Customer Identity` (containing name, email, etc) and another for `Customer Resources`. This second container can then act as the parent node for all of the resources the user owns. Both entities might share the same Id, but have different entity types.

<!--![\[Example showing deliberate decoupling of principals and resources.\]](<img width="80%" src="images/separate-principals-from-resources-3.png">)-->

![\[Example showing deliberate decoupling of principals and resources.\]](images/separate-principals-from-resources-3.png)

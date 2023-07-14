---
layout: default
title: Using the context
parent: Best practices
nav_order: 3
---

# Best practice: Don't use the context field to hold information about the principal, action, and resource
{: .no_toc }

Cedar policy statements include four variables named principal, action, resource, and context. Each variable should be used for its purpose. For example, information about the resource should not be populated in the principal.

We recommend that you avoid using the context field to store information that is more naturally associated with the principal, action or resource. The context field is intended for information unique to a particular request, such as http headers, time of day, the caller’s authentication or device posture, or information about the request parameters.

In addition, context can be used for information that is not naturally affiliated with other entities, such as whether an open support case exists that allows the principal to act upon the resource.


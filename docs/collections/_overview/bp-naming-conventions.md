---
layout: default
title: Naming conventions
parent: Best practices
nav_order: 1
---

# Best practice: Define and use naming conventions

{: .no_toc }

To help ensure consistency in your Cedar policies, we recommend that you define and use a naming convention for the elements in your schema. For example:

<table>
    <tr>
        <th>Identifier type</th>
        <th>Naming convention</th>
        <th>Examples</th>
    </tr>
    <tr>
        <td>&nbsp;Entity type&nbsp;</td>
        <td>&nbsp;PascalCase (camelCase with first letter capitalized)&nbsp;</td>
        <td>&nbsp;User&nbsp;</td>
    </tr>
    <tr>
        <td>&nbsp;Entity instance Id&nbsp;</td>
        <td>&nbsp;Opaque Id or camelCase&nbsp;</td>
        <td>&nbsp;fcaf664d4f89fec0cda8&nbsp;<br/>&nbsp;viewFile</td>
    </tr>
    <tr>
        <td>&nbsp;Attribute names&nbsp;</td>
        <td>&nbsp;camelCase&nbsp;</td>
        <td>&nbsp;resource.countryOfOrigin&nbsp;</td>
    </tr>
    <tr>
        <td>&nbsp;Context keys&nbsp;</td>
        <td>&nbsp;camelCase&nbsp;</td>
        <td>&nbsp;context.uploadFileSize&nbsp;<br/>&nbsp;context.http.headers.userAgent&nbsp;</td>
    </tr>
</table>

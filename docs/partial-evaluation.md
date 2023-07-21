---
layout: default
title: Partial evaluation
nav_order: 12
---

# Partial evaluation of policies<a name="partial-evaluation"></a>
{: .no_toc }

Partial evaluation

<details open markdown="block">
  <summary>
    Topics on this page
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

{: .important }
>Partial evaluation of policies is an experimental feature provided to the Cedar community to try and provide feedback on. We recommend that you not use this feature in a production system.   

## Enabling the feature<a name="enable-experimental"></a>

Before you can use this experimental feature, you must enable it in your instance of the software.

<details>

<summary>How to enable partial evaluation in Rust</summary>

### To turn on the feature using Rust

To turn on partial evaluation using Rust, do this...

```rust
   some-code-to-turn-on-partial-evaluation
```

</details>

## What is partial evaluation<a name="what-is-partial-eval"></a>

There are times when you might want to evaluate an authorization request before you have all of the details for that request. For example, part of the information might be "expensive", as in it takes a long time to evaluate. If the request can result in an `Allow` or `Deny` without peforming that expensive calculation, then you can save that 'cost'. This is possible because of how Cedar combines the results of all of the policies.

* If a single `forbid` policy evaluates to `true`, then you know that the final result is `Deny`, and you don't have to evaluate more policies.
* If all `forbid` policies evaluate to `false` and at least one `permit` evaluates to `true`, then you know that the final result is `Allow`, and you don't have to evaluate any more policies.

Cedar partial evaluation enables you to request evaluation when you don't yet have evaluation results for all policies. In such cases, the missing information is replaced by an `unknown` placeholder. Cedar evaluates every policy that it can. If Cedar determines that the evaluation satisfied one of the two bullets listed previously, then it can return that final result and your application can proceed without having to finish evaluating the rest of the policies. This can improve performance in some cases.

If neither condition specified in the previous bullets is satisfied, then Cedar returns a "residual" that specifies the policies that can't yet be evaluated completely and that might contribute to the final result.

Consider the following policy:

```
permit(principal, action, resource)
when {
    if context.a {
        context.b > 3
    else {
        context.c
    }
};
```

Perhaps context.b and context.c are expense to compute, or are geographically distributed and expensive to retrieve. You could provide these to the `IsAuthorizedPartial` operation with the following parameters:

```json
{
    'a' : true,
    'b' : unknown("b"),
    'c' : unknown("c")
}
```

Partial evaluation of this results in the residual expression:

```
    unknown("b") > 3
```    
    


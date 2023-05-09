---
layout: default
title: Semantics
nav_order: 9
mathjax: true
---

# Policy semantics

Inline policies and policy instances have the same semantics. A policy *c* may refer to an inline policy or a policy instance. An *authorization request* or query is defined as the tuple `<P, A, R, X>` where `P` is a principal, `A` is an action, `R` is a resource, and `X` is the context.  `P`, `A`, and `R` are entity UIDs, while `X` is a record.  (See [Data model, values, and operations])  Cedar’s authorizer grants the request — that principal `P` is allowed to perform the action `A` on the resource `R` in circumstances described by the context `X` — if that request is *satisfied* by the *authorization relation* for a given application, defined by that application’s policy set.  The authorization relation satisfies the request `<P, A, R, X>` if and only if it satisfies at least one permission (`permit`) policy and no restriction (`forbid`) policies.  We define what it means for a request to satisfy a policy as follows.

A request `<P, A, R, X>` satisfies a policy `c` when evaluating `c` on the request produces the value `true`.  More precisely, every policy `c` denotes a function `[[c]]` from entity hierarchies `H` and queries `<P, A, R, X>` to booleans.  We say that `<P, A, R, X>` ***satisfies*** $c$ with respect to the hierarchy $H$ when $[c]_{H}$​`(<P, A, R, X>)` is `true.`

We define the function $[[c]] by evaluating the policy `c` with respect to `H` and the request `<P, A, R, X>`; the variables `principal`, `action`, `resource`, and `context` that appear in `c` bound to the values `P`, `A`, `R`, and `X`, respectively.  The result of the evaluation is `true` if Principal(`c`), Action(`c`), and Resource(`c`) all evaluate to `true`; every `when` expression in `Conds(c)` evaluates to `true`; and every `unless` expression in `Conds(c)` evaluates to `false`. Cedar policies are total functions, which means that they return `true` or `false` for every input. In particular, a policy returns `false` if its evaluation would error under the standard expression semantics, e.g., because the policy attempts to access an attribute that does not exist for a given entity.   

Another way to view evaluation of a policy `c` is that from `c` we can construct the Cedar *expression* `e` which has the form `Principal(c) && Action(c) && Resource(c) && {x | x in Conds(c) }`. Then we evaluate this expression `e` for a particular request `<P,A,R,X>` and hierarchy `H`, resulting in either `true` or `false` . For example, consider the following example policy `c1`. 

```
// "Policy c1"
permit(
    principal in Group::"jane_friends",
    action in [
        Action::"view", 
        Action::"comment"
    ], 
    resource in Album::"jane_trips"
); 
```
      
This policy corresponds to the expression `principal in Group::"jane_friends" && action in [Action::"view", Action::"comment"] && resource in Album::"jane_trips"`. (There are no conditional clauses in this policy.) 

```
// "Policy c2"
forbid(principal, action, resource)
    when { resource.tags.contains("private") }  // assuming resource.tags is a set of strings
    unless { resource in principal.account };  // assuming the principal has an "account" attribute
```

The previous example policy *c2*  corresponds to the expression `true && true && true && resource.tags.contains("private") && !(resource in principal.account)` . (There are no head constraints in this policy, so each is represented by `true` in the expression form.)

In addition to computing an authorization decision (`Allow` or `Deny`), an implementation of Cedar must also compute the reasons that accompany the decision.  Specifically, the authorization output is a triple ⟨dec,reason,error⟩, consisting of a decision dec{Allow,Deny}, a set of reasons, and a set of errors. We consider the output ⟨dec,reason,error⟩to be correct if it satisfies [Definition 1. Authorization semantics]. That is, if `dec` is `Allow` then `reason` consists of the policy IDs for all satisfied permissions.  Otherwise, `dec` must be `Deny`, and `reason` consists of the policy IDs for all satisfied restrictions.  `error` consists of the evaluation error messages. This semantics is deterministic: it is a function of `P`, `A`, `R`, `X`, the entity hierarchy `H`, and the application’s policies `C`.

**Definition 1. Authorization semantics**
Let *C* be the set of an application’s policies, including all the inline policies and policy instances, and `H` its entity hierarchy. Let `I` = `<P, A, R, X>` be an authorization request and define two sets, CI−​⊆C and CI+​⊆C, with respect to `I` as follows.  The set CI−​ consists of all restriction policies c−​∈C that are satisfied by `I`; i.e., CI−​={c−​∈C∣Effect(c−​)=Deny∧[[c−​]]H​(I)}. The set CI+​ consists of all permission policies c+​∈C that are satisfied by *I*. Given these sets, the authorization output ⟨dec,reason,error⟩∈{Allow,Deny} for *I* is determined as follows:

* If CI+​ is empty or CI−​ is not empty, then dec=Deny and reason={PolicyID(c−​)∣c−​∈CI−​}.
* Otherwise, dec=Allow and reason={PolicyID(c+​)∣c+​∈CI+​}.
* *error* = All the evaluation error messages


**Example 1, semantics**
Consider policies *c1* and *c2* above, and the entity hierarchy in Figure 2. Suppose that we extend this hierarchy with the following entities.
[Image: Image.jpg]If the user send*s* the request `<P=User::"alice", A=Action::"view", R=Photo::"summer", X={}>`*,* the policy *c1* is satisfied because `User::"alice"` belongs to the group `Group::`“`jane_friends"`, the resource `Photo::"summer"` belongs to the group `Album::"jane_trips"`, and the action  `Action::"view"` appears in the list `[Action::"view", Action::"comment"]`. Policy *c2* is *not* satisfied because `resource.tags.contains("private")`, i.e., the resource `Photo::"summer"`'s attribute `tags` does not contain `"private"`. Therefore, c1∈CI+​, while CI−​ is empty. The decision is `Allow`.  

If the user sends the request `<P=User::“alice”, A=Action::"view", R=Photo::"receipt", X={}>`*,* the policy *c1* is satisfied for reasons similar to the above. However, policy *c2* is *also* satisfied because the `when` condition evaluates to `true`. This is because resource `Photo::"receipt"`'s attribute `tags` contains `"private"`, and *c2*'s `unless` condition evaluates to `false` because the photo is not a member of to `User::"alice"`'s `account`. Therefore, c1∈CI+​ and c2∈CI−​.  Because CI−​ is nonempty, the decision is `Deny`, i.e., the `forbid` policy *c2* overrides the `permit` policy *c1.*


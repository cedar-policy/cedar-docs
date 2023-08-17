---
layout: default
title: Authorization
nav_order: 5
---

# How Cedar authorization works<a name="how-cedar-authorization-works"></a>
{: .no_toc }

Each time a user of your application wants to perform an action on a protected resource, the application needs to invoke the Cedar authorization engine (or *authorizer*, for short) to check if this request is allowed.
The authorizer considers the request against the application's store of policies in order to make a decision, `Allow` or `Deny`. This topic discusses how the Cedar authorizer decides the answer to a particular request.

## Request creation<a name="request-creation"></a>

A Cedar *authorization request* asks the question "*Can this principal take this action on this resource in this context?*". More formally, an authorization request has four parts, abbreviated *PARC*:
+ *P* is the principal, 
+ *A* is the action, 
+ *R* is the resource, and 
+ *C* is the request context. 

*P*, *A*, and *R* are [entity references](terminology.md#term-entity), while *C* is a record.

Conceptually, you should imagine that the authorizer is able to consider *all* of your application's policies and entity data while evaluating a request. As a practical matter, making all policies and entity data available might be too difficult or too expensive. In that case, your application needs to determine which policies and entity data are *relevant* to properly handling the request.

## Request authorization<a name="request-authorization"></a>

Given an authorization request, Cedar’s authorizer returns `Allow` if the request is granted or `Deny` if it is rejected, along with some diagnostics. How does it make this decision?

### Algorithm<a name="request-authorization-algorithm"></a>

First, the authorizer *evaluates* each of the policies to determine if the policy *satisfies* the request. More details about evaluation follow, but in summary, know that the evaluator can return:
+ `true`, when the policy satisfies the request;
+ `false`, when the policy does not satisfy the request; or
+ `error`, when there is an error when evaluating the policy on the request data.

After evaluating each policy, the authorizer combines the results to make an authorization decision. It makes its decision by applying the following rules:

1. If any `forbid` policy evaluates to `true`, then the final result is `Deny`.

2. Else, if any `permit` policy evaluates to `true`, then the final result is `Allow`.

3. Otherwise (i.e., no policy is satisfied), the final result is `Deny`.

The authorizer returns an *authorization response*, which includes its decision along with some diagnostics. These diagnostics include the *determining policies* and any *error conditions*. If the decision is `Allow`, the determining policies are the `permit` policies that satisfy the request (rule 2). Otherwise, the determining policies are the `forbid` policies, if any, that satisfy the request (rule 1). If the decision is `Deny` because no policies were satisfied (rule 3), then the list of determining policies is empty. Whatever the final result, if the evaluation of any policies resulted in `error`, then the IDs of the erroneous policies are included in the diagnostics, too, along with the particulars of the errors.

### Discussion<a name="request-authorization-discussion"></a>

Cedar's authorization algorithm has three useful properties:

1. **default deny**: no request is authorized (decision `Allow`) unless there is a specific `permit` policy that grants it; by default, the decision is `Deny`. 
1. **forbid overrides permit**: even if a `permit` policy is satisfied, any satisfied `forbid` policy *overrides* it, producing a `Deny` decision. 
1. **skip on error**: if a policy's evaluation returns `error`, the policy does not factor into the authorization response; it is skipped.

Why was Cedar's authorization algorithm designed to satisfy these properties? The first two properties make Cedar policies easier to understand. Since `permit` policies are the only way access is granted, readers just have to understand what each policy says, not what it doesn't. Because `forbid` policies *always* deny access, readers can understand them independently of any `permit` policies created now or in the future; `forbid` policies effectively define permission "guardrails" that `permit` policies cannot cross. 

The reasoning for the skip-on-error property is more involved. An alternative authorization algorithm we considered would be to `Deny` a request when any policy evaluation exhibits an error. While this might sound good at first, deny-on-error raises concerns of *safety*. An application that was working fine with 100 policies might suddenly start denying *all* requests if the 101st policy has an error. Skip-on-error avoids this dramatic failure mode, and is more flexible: applications can always choose to look at the authorization response's diagnostics and take a different decision if an evaluated policy produces errors. For more information, see this [blog post](https://cedarland.blog/design/why-ignore-errors/content.html) written by one of the Cedar designers. 

## Policy evaluation<a name="policy-evaluation"></a>

As just discussed, to reach its decision the Cedar authorizer's algorithm *evaluates* a request *PARC* against each policy it is given. Evaluation returns whether or not the policy is satisfied by the request (`true`/`false`), or whether an error occurred during evaluation (`error`). How does evaluation work?

### Expression evaluation<a name="expression-evaluation"></a>

The key component of policy evaluation is *expression* evaluation. Each constraint in the policy scope is an expression. Each `when` clause also contains an expression, as does each `unless` clause. Evaluating a policy requires evaluating its constituent expressions. Example expressions include `resource.tags.contains("private")`, `action == Action::"viewPhoto"`, `principal in Team::"admin"`, and `resource in principal.account`. 

As with a typical programming language, evaluating an expression simplifies, or "executes", the expression until no further simplification is possible. The final result is either a Cedar *value* -- like `true`, `1`, `User::"Alice"`, or `"blue"` -- or it is an `error`. Evaluating an expression with no variables is straightforward. The expression `2+2` evaluates to `4`. Expression `Action::"viewPhoto" == Action::"viewPhoto"` evaluates to `true`. Expression `if false then "blue" else "green"` evaluates to `"green"`. See [here](syntax-operators.md#syntax-operators) for complete descriptions of the various operators you can use in Cedar expressions.

What about expressions that have variables `principal`, `action`, `resource`, and `context` in them? To evaluate such expressions the Cedar authorizer first *binds* any variables that appear in the expressions to values of the appropriate type. Then the authorizer evaluates the expressions with those values in place of the variables. 

For example, consider the expression `action == Action::"viewPhoto"`. If the authorizer binds the `action` variable to the entity `Action::"viewPhoto"`, then the result is `true`. That's because replacing `action` with `Action::"viewPhoto"` gives expression `Action::"viewPhoto" == Action::"viewPhoto"` which is obviously `true`.

As another example, consider the expression `resource.tags.contains("Private")`. If the authorizer binds the `resource` variable to the entity `Photo::"vacation94.jpg"` we get `Photo::"vacation94.jpg".tags.contains("Private")`. Evaluating further, the authorizer must look up `Photo::"vacation94.jpg"` in the provided entities data, and then extract its `tags` attribute. If that attribute contains a set with the string `"Private"` in it, the result is `true`; if it's a set without `"Private"` the result is `false`. Otherwise `tags` is either not a valid attribute or contains a non-set, and Cedar generates an `error`.

### Policy satisfaction<a name="policy-satisfaction"></a>

Determining whether a policy satsifies a request is a straightforward use of expression evaluation. To explain it, let's introduce some notation. For a policy *c*:
+ *Principal(c)* is the constraint involving the `principal` in *c*'s [policy scope](terminology.md#term-policy). If there is no constraint on `principal`, then *Principal(c)* is `true`.
+ *Action(c)* is the constraint involving `action` in *c*'s policy scope. If there is no constraint on `action`, then *Action(c)* is `true`.
+ *Resource(c)* is the constraint involving `resource` in *c*'s policy scope. If there is no constraint on `resource`, then *Resource(c)* is `true`.
+ *Conds(c)* is the list of `when` and `unless` expressions in *c*.

Here's how the Cedar authorizer evaluates a policy *c* with respect to a *PARC* request. First, the authorizer tests whether *c* **matches** the request, as follows:
1. Bind `principal` to *P* in expression *Principal(c)* and evaluate it
1. Bind `action` to *A* in expression *Action(c)* and evaluate it
1. Bind `resource` to *R* in expression *Resource(c)* and evaluate it

If all three steps evaluate to `true`, then *c* matches the request. Otherwise it does not. (Cedar's design ensures that none of these three steps can possibly evaluate to `error`.)

If *c* matches the request, the authorizer evaluates the request's conditions *Conds(c)* in order. The authorizer binds the `principal`, `action`, `resource`, and `context` variables to the *PARC* values when we do so. If all of the `when` conditions evaluate to `true`, and all of the `unless` conditions evaluate to `false`, then policy *c* satsifies the request, and the final evaluation result is `true`. If evaluating any condition expression yields `error` then policy evaluation halts at that point (any remaining conditions are skipped), and `error` is returned as the final result. Otherwise, `false` is returned.

## Detailed Example<a name="policy-evaluation-example"></a>

To illustrate policy evaluation, consider whether a set of four policies authorizes the following request: "Can the user `jane` perform the action `viewPhoto` on the photo `vacation.jpg`?" Precisely, the request is:
+ *P* = `User::"jane"`
+ *A* = `Action::"viewPhoto"`
+ *R* = `Photo::"vacation.jpg"`
+ *C* = `{}` (the empty record)

Assume that the entities data includes the following details:
+ Entity `User::"jane"` is a member of `Group::"kevinsFriends"`
+ Entity `Photo::"vacation.jpg"` has the following attributes:
  + `.owner` is `User::"kevin"`
  + `.tags` is `["Private","Work"]` (i.e., a set containing the strings `"Private"` and `"Work"`)

The Cedar authorizer evaluates each of the four policies against this request.

+ **P1** – Jane can perform any action on photo `vacation.jpg`.

  ```
  permit( 
      principal == User::"jane", 
      action, 
      resource == Photo::"vacation.jpg"
  );
  ```
  This policy is **satisfied**.
    - *Principal* in P1 is `principal == User::"jane"`, so after binding `principal` to `User::"jane"` (the *P* in the request), the expression evaluates to `true`.
    - *Action* in P1 is simply `true` since there is no action constraint.
    - *Resource* in P1 is `resource == Photo::"vacation.jpg"`, so after binding `resource` to `Photo::"vacation.jpg"` (the *R* in the request), the expression evaluates to `true`.
    - *Cond(c)* is empty, so evaluates trivially to `true`.

+ **P2** – A member of group `kevinFriends` can view any of Kevin's photos when they are tagged `Holiday`

  ```
  permit(
      principal in UserGroup::"kevinFriends",
      action == Action::"viewPhoto",
      resource
  )
  when {
      resource.tags.contains("Holiday")
  };
  ```
  This policy is **not satisfied**. While it matches the request, its *condition evaluates to `false`*.
    * *Principal* in P2 is `principal in UserGroup::"kevinFriends"`, so after binding `principal` to `User::"jane"` (the *P* in the request), the expression evaluates to `true` because `User::"jane"` is a member of `Group::"kevinsFriends"`
    * *Action* in P2 is `action == Action::"viewPhoto"`, so after binding `action` to `Action::"viewPhoto"` the expression evaluates to `true`
    * *Resource* in P2 is simply `true` since there is no resource constraint
    * *Cond(c)* in P2 is the list containing `when` expression `resource.tags.contains("Holiday")`. After binding `resource` to `Photo::"vacation.jpg"` (the *R* in the request), the expression evaluates to `false` because the `.tags` attribute of `Photo::"vacation.jpg"` is `["Private","Work"]`, i.e., it does not contain `"Holiday"`.

+ **P3** – Users are forbidden from viewing any photos tagged `Private` unless they are the owner of the photo.

  ```
  forbid(
      principal,
      action == Action::"viewPhoto",
      resource
  )
  when { resource.tags.contains("Private") }
  unless { principal == resource.owner };
  ```
  This policy is **satisfied**.
    * The policy matches the request: `principal` and `resource` are unconstrained, and *Action(c)* evaluates to `true` because *A* is `Action::"viewPhoto"`;
    * The policy's `when` condition is `true` because the `.tags` attribute of `Photo::"vacation.jpg"` contains `"Private"`; and
    * The policy's `unless` condition is `false` because the `.owner` attribute of `Photo::"vacation.jpg"` (which is `User::"kevin"`) is not equal to *P* (which is `User::"jane"`).

+ **P4** – Users can perform `updateTags` on a resource, like a `Photo` or `Album`, when they are the owner of the resource

  ```
  permit(
      principal,
      action == Action::"updateTags",
      resource
  )
  when { principal == resource.owner };
  ```
  This policy is **not satisfied**.
    - The policy ***fails to match the request*** because while `principal` and `resource` are unconstrained, *Action(c)* evaluates to `false` because binding `action` to *A* yields expression `Action::"viewPhoto" == Action::"updatePassword"`.

In sum:
+ `permit` policy P1 evaluates to `true`
+ `permit` policy P2 evaluates to `false`
+ `forbid` policy P3 evaluates to `true`
+ `permit` policy P4 evaluates to `false`

Combining these policy evaluation results, the Cedar authorizer returns a decision of `Deny`, where the determining policy is P3. This result follows from rule 1 of our [authorization logic](#request-authorization-algorithm): "If any forbid policy evaluates to `true`, then the final result is `Deny`" (and the determining policies are the satisfied `forbid` policies).

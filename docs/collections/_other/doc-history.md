---
layout: default
title: Document history
nav_order: 14
---

# History for the Cedar Policy Language {#doc-history}
{: .no_toc }

## Document history for the Cedar Policy Language Guide
The following table describes major documentation updates for Cedar.

| Description | Date |
| --- | --- |
| Removed references to "unspecified" entities | TBD |
| Added [JSON policy set format](../policies/json-format.html#policy-set-format) sub-topic | TBD |
| Added [Human-readable schema format](../schema/human-readable-schema.html) topic | February 21, 2024 |
| Added [`is` operator](../policies/syntax-operators.html#operator-is) sub-topic | December 15, 2023 |
| Added [Entities & context syntax](../auth/entities-syntax.html) topic | July 27, 2023 |
| Added [Schema grammar](../schema/schema-grammar.html) topic | July 17, 2023 |
| Added [JSON policy format](../policies/json-format.html) topic | July 14, 2023 |
| Added [Best Practices](../overview/best-practices.html) topics | July 14, 2023 |
| Initial release of the Cedar Policy Language Guide | May 10, 2023 |

## History of the Cedar language

The following table tracks changes to the Cedar language version. The language version is different from the SDK version (which corresponds to the `cedar-policy` version on [crates.io](https://crates.io/crates/cedar-policy)) because a breaking change for the Cedar Rust API may or may not be a breaking change for the Cedar language. See the [SDK changelog](https://github.com/cedar-policy/cedar/blob/main/cedar-policy/CHANGELOG.md) for details about what is included in different SDK versions. We recommend using the latest SDK version that supports your desired language version since later SDK versions may contain important bug fixes and improvements to usability.

| Cedar<br/>Version | Description | Cedar SDK<br/>Version(s) | Date |
| --- | --- | --- | --- |
| 4.0 | Remove unspecified entities [rfc#55](https://github.com/cedar-policy/rfcs/blob/main/text/0055-remove-unspecified.md) | 4.0.0 | TBD |
| 3.3 | References between common types [cedar#154](https://github.com/cedar-policy/cedar/issues/154) | 3.2.0 - 3.2.1 | May 17, 2024 |
| 3.2 | General multiplication operator [rfc#57](https://github.com/cedar-policy/rfcs/blob/main/text/0057-general-multiplication.md) | 3.1.2 - 3.1.4 | March 29, 2024 |
| 3.1 | Human-readable schema syntax [rfc#24](https://github.com/cedar-policy/rfcs/blob/main/text/0024-schema-syntax.md) | 3.1.0 - 3.1.1 | March 8, 2024 |
| 3.0 | `is` operator [rfc#5](https://github.com/cedar-policy/rfcs/blob/main/text/0005-is-operator.md)<br/>Stricter validation [rfc#19](https://github.com/cedar-policy/rfcs/blob/main/text/0019-stricter-validation.md)<br/>Disallow duplicate keys in records [rfc#20](https://github.com/cedar-policy/rfcs/blob/main/text/0020-unique-record-keys.md)<br/>Request validation [cedar#191](https://github.com/cedar-policy/cedar/issues/191)<br/>Entity validation [cedar#360](https://github.com/cedar-policy/cedar/pull/360) | 3.0.0 - 3.0.1 | December 15, 2023 |
| 2.2 | General multiplication operator (backport to 2.x) [rfc#57](https://github.com/cedar-policy/rfcs/blob/main/text/0057-general-multiplication.md) | 2.4.5 - 2.4.7 | April 1, 2024 |
| 2.1 | Disallow whitespace in namespaces [rfc#9](https://github.com/cedar-policy/rfcs/blob/main/text/0009-disallow-whitespace-in-entityuid.md) | 2.3.0 - 2.4.4 | June 29, 2023 |
| 2.0 | Initial release of the Cedar Policy Language | 2.0.0 - 2.2.0 | May 10, 2023 |

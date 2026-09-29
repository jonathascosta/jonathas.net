---
title: "Regular Expressions Arrive in T-SQL: A Practical Tour of SQL Server 2025"
description: "SQL Server 2025 adds seven REGEXP functions to T-SQL. Here's how to use them to validate, clean, extract and split text, and what to watch for with indexes, collations and compatibility levels."
pubDate: 2026-09-29
heroImage: ../../assets/images/articles/sql-server-2025-regular-expressions.webp
heroAlt: "A REGEXP_REPLACE query that fixes postal codes, next to the values before and after: 1100148 becomes 1100-148 and 4460 100 becomes 4460-100"
tags: [SQL, SQL Server, Databases]
---

For years, pattern matching in T-SQL meant `LIKE` with its `%`, `_` and `[...]` wildcards, a `PATINDEX` here and there, or a CLR function that nobody wanted to maintain. SQL Server 2025 finally brings regular expressions to the language, with seven `REGEXP_*` functions. They're also available in Azure SQL Database, in SQL database in Microsoft Fabric, and in Azure SQL Managed Instance with the *SQL Server 2025* or *Always-up-to-date* update policy.

The implementation is based on Google's [RE2](https://github.com/google/re2) library. That detail matters, and we'll come back to it.

## The seven functions

| Function | What it does |
| --- | --- |
| `REGEXP_LIKE` | Returns true when the text matches the pattern. Use it in `WHERE` and `CHECK`. |
| `REGEXP_REPLACE` | Replaces matches, with support for capture groups (`\1`…`\9`). |
| `REGEXP_SUBSTR` | Returns the *n*th match, or one of its capture groups. |
| `REGEXP_INSTR` | Returns the start or end position of a match. |
| `REGEXP_COUNT` | Counts the matches. |
| `REGEXP_MATCHES` | Table-valued: one row per match, with positions and capture groups. |
| `REGEXP_SPLIT_TO_TABLE` | Table-valued: splits text on a pattern. |

One setup detail first. `REGEXP_LIKE`, `REGEXP_MATCHES` and `REGEXP_SPLIT_TO_TABLE` require **database compatibility level 170**. The other four work at any level. A database restored from an older version keeps its old level, so check it:

```sql
SELECT name, compatibility_level FROM sys.databases;

ALTER DATABASE Shop SET COMPATIBILITY_LEVEL = 170;
```

## A table with the usual problems

Every example below uses this small customer table. Its data comes in the usual shapes: phone numbers typed four different ways, postal codes with and without the hyphen, and one email address without a top-level domain.

```sql
CREATE TABLE dbo.Customers
(
    CustomerID int IDENTITY PRIMARY KEY,
    FullName   nvarchar(100) NOT NULL,
    Email      varchar(320)  NOT NULL,
    Phone      varchar(30)   NULL,
    PostalCode varchar(10)   NULL,
    Notes      nvarchar(400) NULL
);

INSERT INTO dbo.Customers (FullName, Email, Phone, PostalCode, Notes)
VALUES (N'Ana Ribeiro', 'ana.ribeiro@example.pt', '+351 912 345 678',   '4000-322', N'Asked about #invoices and #refunds'),
       (N'Bruno Lima',  'bruno.lima@example.com', '912-345-678',        '1100148',  N'Prefers email. #vip'),
       (N'Carla Sousa', 'carla.sousa@example',    '(+351) 22 123 4567', '4460 100', NULL),
       (N'David Costa', 'David.Costa@Example.PT', '22 123 45 67',       '4000-322', N'#invoices #invoices');
```

## Validate: find the rows that don't fit

`REGEXP_LIKE` reads like a function but behaves like a predicate. Here it finds email addresses that don't have the basic `name@domain.tld` shape:

```sql
SELECT CustomerID, Email
FROM dbo.Customers
WHERE NOT REGEXP_LIKE(Email, '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
```

| CustomerID | Email |
| --- | --- |
| 3 | carla.sousa@example |

The same check on Portuguese postal codes, whose format is four digits, a hyphen and three digits:

```sql
SELECT CustomerID, PostalCode
FROM dbo.Customers
WHERE NOT REGEXP_LIKE(PostalCode, '^\d{4}-\d{3}$');
```

| CustomerID | PostalCode |
| --- | --- |
| 2 | 1100148 |
| 3 | 4460 100 |

Once the data is clean, move the rule into the schema so it stays clean. `REGEXP_LIKE` works in a `CHECK` constraint:

```sql
ALTER TABLE dbo.Customers
    ADD CONSTRAINT CK_Customers_PostalCode
    CHECK (REGEXP_LIKE(PostalCode, '^\d{4}-\d{3}$'));
```

## Clean: replace with capture groups

`REGEXP_REPLACE` removes or rewrites whatever matches. To normalize the phone numbers, drop everything except digits and the plus sign:

```sql
SELECT Phone, REGEXP_REPLACE(Phone, '[^0-9+]', '') AS Normalized
FROM dbo.Customers;
```

| Phone | Normalized |
| --- | --- |
| +351 912 345 678 | +351912345678 |
| 912-345-678 | 912345678 |
| (+351) 22 123 4567 | +351221234567 |
| 22 123 45 67 | 221234567 |

The replacement can use the parenthesized groups of the pattern: `\1` to `\9` insert a group, and `&` inserts the whole match. That's enough to repair the postal codes before adding the constraint above:

```sql
UPDATE dbo.Customers
SET PostalCode = REGEXP_REPLACE(PostalCode, '^(\d{4})\s*-?\s*(\d{3})$', '\1-\2')
WHERE REGEXP_LIKE(PostalCode, '^\d{4}\s*-?\s*\d{3}$');
```

`1100148` becomes `1100-148` and `4460 100` becomes `4460-100`, while values that were already right are rewritten to themselves. By default every match is replaced. Optional arguments set a start position and which single occurrence to replace.

## Extract: one match, or one group of it

`REGEXP_SUBSTR` returns a match, and its last argument can pick a capture group instead of the whole match. That makes extracting the domain of an email address a one-liner. Combined with a [common table expression](/sql-ctes.html), it counts customers per domain:

```sql
WITH Domains AS
(
    SELECT LOWER(REGEXP_SUBSTR(Email, '@(.+)$', 1, 1, 'c', 1)) AS Domain
    FROM dbo.Customers
)
SELECT Domain, COUNT(*) AS Customers
FROM Domains
GROUP BY Domain
ORDER BY Customers DESC;
```

| Domain | Customers |
| --- | --- |
| example.pt | 2 |
| example.com | 1 |
| example | 1 |

The arguments after the pattern are the start position (`1`), the occurrence (`1`), the flags (`'c'`, case-sensitive, the default) and the group (`1`, the part in parentheses).

## Count and list every match

`REGEXP_COUNT` counts the matches in each row, which is handy for tags written inside free text:

```sql
SELECT CustomerID, REGEXP_COUNT(Notes, '#\w+') AS Tags
FROM dbo.Customers
WHERE Notes IS NOT NULL;
```

To see the matches themselves, `REGEXP_MATCHES` returns one row per match. Its columns are `match_id`, `start_position`, `end_position`, `match_value`, and `substring_matches`, a JSON array with the capture groups. With `CROSS APPLY`, it runs once per customer:

```sql
SELECT c.CustomerID, m.match_value AS Tag, m.start_position
FROM dbo.Customers AS c
CROSS APPLY REGEXP_MATCHES(c.Notes, '#\w+') AS m;
```

| CustomerID | Tag | start_position |
| --- | --- | --- |
| 1 | #invoices | 13 |
| 1 | #refunds | 27 |
| 2 | #vip | 16 |
| 4 | #invoices | 1 |
| 4 | #invoices | 11 |

## Split on a pattern

`STRING_SPLIT` takes a single separator character. `REGEXP_SPLIT_TO_TABLE` takes a pattern, so inconsistent separators and stray spaces are no longer a problem:

```sql
SELECT value, ordinal
FROM REGEXP_SPLIT_TO_TABLE('sql, azure;regex ,  t-sql', '\s*[,;]\s*');
```

| value | ordinal |
| --- | --- |
| sql | 1 |
| azure | 2 |
| regex | 3 |
| t-sql | 4 |

## Flags

Every function takes an optional flags string: `i` for case-insensitive, `m` for multi-line (`^` and `$` also match at line breaks), `s` to let `.` match a newline, and `c` for case-sensitive, which is the default. If flags contradict each other, the last one wins, so `'ic'` is case-sensitive. Flags can also go inside the pattern, as in `(?i)abc`.

## What RE2 doesn't do

RE2 guarantees that matching takes time proportional to the size of the input. It gets that guarantee by leaving out the features that need backtracking: **lookaheads, lookbehinds and backreferences inside the pattern**. A pattern such as `(?=\d)` or `(\w)\1`, which works in .NET, is rejected. In exchange, no pattern can hang your server with catastrophic backtracking. Most validation and cleanup patterns don't need those features anyway, and `\1` still works in the *replacement* string of `REGEXP_REPLACE`.

## Performance and correctness notes

- **Anchor the pattern if you want an index seek.** `REGEXP_LIKE` is only SARGable when the pattern starts with `^`, followed by literals, character ranges and quantifiers. `REGEXP_LIKE(Email, '^ana')` can seek an index on `Email`; `REGEXP_LIKE(Email, 'ana')` scans.
- **Regular expressions ignore collations.** `LIKE` follows the column's collation, so a case-insensitive collation makes `LIKE 'ana%'` match `Ana`. A regex is case-sensitive unless you pass `i`. Language rules don't apply either, such as the distinct dotted and dotless `i` of Turkish collations.
- **Don't replace `LIKE` where `LIKE` is enough.** `LIKE 'abc%'` is simple, fast and collation-aware. Use regular expressions when the pattern is hard to express with wildcards.
- **Know the limits.** `varchar(max)` and `nvarchar(max)` inputs are supported up to 2 MB, patterns up to 8,000 bytes, and the functions can't be used in natively compiled stored procedures.
- **Help the optimizer with estimates.** For queries whose row estimates are far off, the `ASSUME_FIXED_MIN_SELECTIVITY_FOR_REGEXP` and `ASSUME_FIXED_MAX_SELECTIVITY_FOR_REGEXP` query hints adjust the selectivity the optimizer assumes for `REGEXP_LIKE`.

Regular expressions won't replace good schema design. But for the validation, cleanup and parsing jobs that used to be pushed to application code or a CLR assembly, T-SQL can now do the work where the data lives.

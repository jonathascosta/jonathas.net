---
title: "From .NET 8 to .NET 10: An Upgrade Checklist Before Support Ends"
description: ".NET 8 and .NET 9 both reach end of support on November 10, 2026. Here's a practical checklist for moving a service straight to .NET 10, the next LTS release, and the C# 14 features worth adopting on the way."
pubDate: 2026-09-29
heroImage: ../../assets/images/articles/dotnet-8-to-dotnet-10.webp
heroAlt: "Support timeline of .NET 8, .NET 9 and .NET 10: .NET 8 and .NET 9 end on November 10, 2026, while .NET 10 is supported until November 2028"
tags: [.NET, C#, Upgrades]
---

On **November 10, 2026**, [.NET 8 and .NET 9 reach end of support](https://devblogs.microsoft.com/dotnet/dotnet-8-9-end-of-support/) on the same day. .NET 8 is the long-term support (LTS) release from November 2023. .NET 9 is a standard-term release, which Microsoft now supports for 24 months, so it ends together with .NET 8. After that date neither gets security fixes.

The destination is **.NET 10**, the LTS release that shipped in November 2025 and is [supported until November 2028](https://dotnet.microsoft.com/platform/support/policy/dotnet-core). If you're on .NET 8 there's no reason to stop at .NET 9: go straight to 10. This is the checklist I follow for a typical ASP.NET Core service, from the project file to the container image.

## 1. Install the SDK and pin it

Install the .NET 10 SDK, then make the repository say which SDK it expects. A `global.json` at the root keeps every machine and every CI run on the same major version while still picking up patch releases:

```json
{
  "sdk": {
    "version": "10.0.100",
    "rollForward": "latestFeature"
  }
}
```

With `latestFeature`, any installed 10.0 SDK at or above 10.0.100 is accepted, but a newer major version is not.

## 2. Change the target framework in one place

If your solution has a `Directory.Build.props`, the upgrade is a one-line change for every project. If it doesn't, this is a good moment to add one:

```xml
<Project>
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>
</Project>
```

Projects that target `net10.0` compile as C# 14 by default, so there's no `LangVersion` to bump.

## 3. Update the packages that follow the runtime

Packages such as `Microsoft.EntityFrameworkCore.*`, `Microsoft.Extensions.*` and `Microsoft.AspNetCore.*` are versioned with .NET, so the 8.x versions should move to 10.x together. The SDK now has noun-first commands, and this one lists what's behind:

```bash
dotnet package list --outdated
```

Two things tend to surprise people at this step:

- **Restore now audits transitive packages.** For projects targeting .NET 10, `NuGetAuditMode` defaults to `all`, so a vulnerable package deep in your dependency tree produces an `NU1901`–`NU1904` warning. With `TreatWarningsAsErrors`, that fails the restore. Run `dotnet nuget why <project> <package>` to see which top-level package brings it in, and upgrade that one.
- **LINQ for `IAsyncEnumerable` is now built in.** .NET 10 ships `System.Linq.AsyncEnumerable`, which clashes with the community `System.Linq.Async` package. Remove that package reference (or move to its version 7), and replace calls such as `SelectAwait` with the new `Select` overloads.

## 4. Test the behaviour changes, not just the build

A clean build isn't the finish line. Going from 8 to 10 means taking the [.NET 9](https://learn.microsoft.com/dotnet/core/compatibility/9.0) and [.NET 10](https://learn.microsoft.com/dotnet/core/compatibility/10) breaking changes together. These are the ones most likely to affect a web API or a worker service:

- **`BackgroundService` starts differently.** In .NET 10, all of `ExecuteAsync` runs on a background thread. Before, the code up to the first `await` ran synchronously during startup and blocked other services. If you relied on that ordering, move the work to the constructor or override `StartAsync`.
- **`null` in configuration stays `null`.** The binder used to treat a `null` value as missing, and the JSON provider turned it into an empty string. Now `"Timeout": null` binds as `null`, so check options classes that have non-null defaults.
- **Tracing uses the W3C propagator by default.** `DistributedContextPropagator.Current` now follows the W3C Trace Context and Baggage specifications. Baggage no longer uses the old `Correlation-Context` header. If an older service downstream still expects it, you can switch back with `DistributedContextPropagator.CreatePreW3CPropagator()` while you migrate.
- **`HttpClientFactory` logs redact header values** (a .NET 9 change). If you debug integrations from logs, you'll see `*` where header values used to be. Call `RedactLoggedHeaders` with only the sensitive headers to log the others again.
- **`BinaryFormatter` always throws** (also .NET 9). If anything still serializes with it, this is the upgrade where it finally breaks.
- **The runtime no longer installs its own `SIGTERM` handler.** ASP.NET Core and anything on the Generic Host are unaffected, because the host registers its own. A plain console app that counted on `ProcessExit` to clean up needs a `PosixSignalRegistration`.

## 5. Move the container images and the pipeline

Update the image tags in your `Dockerfile` from `8.0` to `10.0`:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY . .
RUN dotnet publish src/Api -c Release -o /app

FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
ENTRYPOINT ["dotnet", "Api.dll"]
```

The default .NET 10 images are **based on Ubuntu, and Debian images are no longer provided**. Most apps won't notice. However, a `RUN apt-get install …` line that depends on a Debian package name is worth testing.

In CI, let the pipeline read the SDK version from `global.json`, so there's only one place to change next time. With GitHub Actions:

```yaml
- uses: actions/checkout@v7
- uses: actions/setup-dotnet@v6
  with:
    global-json-file: global.json
- run: dotnet test
```

## 6. Adopt C# 14 where it removes code

Nothing forces you to use the new language features, but a few of them delete real boilerplate. The examples below compile and run on the .NET 10 SDK.

**The `field` keyword** refers to the compiler-generated backing field, so a property with a little logic in its setter no longer needs a private field:

```csharp
public sealed class Customer
{
    public required string Name { get; init; }

    public required string Email
    {
        get;
        set => field = value.Trim().ToLowerInvariant();
    }
}
```

**Null-conditional assignment** allows `?.` on the left of `=`. The right side is only evaluated when the target isn't `null`:

```csharp
customer?.Email = LoadEmail(); // LoadEmail() doesn't run when customer is null
```

**Extension members** add extension properties and static extensions, grouped in an `extension` block:

```csharp
public static class StringExtensions
{
    extension(string value)
    {
        public bool IsBlank => string.IsNullOrWhiteSpace(value);

        public string Truncate(int maxLength) =>
            value.Length <= maxLength ? value : value[..maxLength];
    }
}

// "".IsBlank == true, "Hello, .NET 10".Truncate(5) == "Hello"
```

Also handy: `nameof(List<>)` now works with unbound generic types, and lambda parameters can take modifiers without their types, as in `(text, out result) => int.TryParse(text, out result)`.

## 7. Bonus: scripts without a project

.NET 10 can run a single `.cs` file with `dotnet run app.cs`, with no `.csproj`. Add a shebang and it runs like any script:

```csharp
#!/usr/bin/env dotnet
Console.WriteLine($"Running on .NET {Environment.Version}");
```

File-based apps can reference packages and projects with `#:package` and `#:project` directives, and `dotnet publish app.cs` produces a native executable. They're a good replacement for the small console projects that pile up in a `tools/` folder.

## The short version

1. Install the .NET 10 SDK and pin it in `global.json`.
2. Change `TargetFramework` to `net10.0`, ideally in `Directory.Build.props`.
3. Update the `Microsoft.*` packages to 10.x, and deal with NuGet audit warnings and `System.Linq.Async`.
4. Test the behaviour changes: `BackgroundService` startup, `null` configuration values, W3C tracing, redacted headers, `BinaryFormatter` and `SIGTERM`.
5. Move the Docker images (now Ubuntu-based) and point CI at `global.json`.
6. Adopt C# 14 where it deletes code.

Start with the service with the best test coverage, and give yourself a few weeks before November 10.

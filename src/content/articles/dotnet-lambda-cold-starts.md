---
title: "Taming .NET Cold Starts on AWS Lambda: SnapStart, Native AOT and When to Use Each"
description: "Cold starts are the price of running .NET on Lambda. Here's how to measure them, the cheap fixes to try first, and how SnapStart and Native AOT compare on the .NET 10 runtime."
pubDate: 2026-09-29
heroImage: ../../assets/images/articles/dotnet-lambda-cold-starts.webp
heroAlt: "Diagram of a Lambda cold start in three variants: a regular start runs the whole init phase, SnapStart resumes from a snapshot taken when the version is published, and Native AOT starts a precompiled executable without a JIT"
tags: [.NET, AWS Lambda, Serverless, Performance]
---

.NET runs well on AWS Lambda once it's warm. The problem is the first request that lands on a new execution environment: before your handler runs, Lambda has to start the runtime, load your assemblies, JIT-compile the code on the hot path, build the dependency injection container and create your SDK clients. That's the **cold start**, and for .NET it's usually longer than for interpreted languages.

The tools to fight it keep improving. The managed **`dotnet10` runtime** has been available [since January 2026](https://aws.amazon.com/about-aws/whats-new/2026/01/aws-lambda-dot-net-10/), with support for SnapStart, and the Native AOT templates now target .NET 10 too. Here's how I'd approach it.

## Measure before you optimize

Every cold start writes an `Init Duration` to the `REPORT` line that Lambda logs after an invocation. CloudWatch Logs Insights exposes it as `@initDuration`, so one query tells you how often cold starts happen and how long they take:

```text
filter @type = "REPORT" and ispresent(@initDuration)
| stats count() as coldStarts,
        pct(@initDuration, 50) as p50,
        pct(@initDuration, 95) as p95
  by bin(1h)
```

Run it before and after each change. Cold starts only hurt if they're frequent enough, or slow enough, to show up in the latency your users see.

## Cheap fixes first

These cost little and help whatever you decide later:

- **Give the function more memory.** Lambda allocates CPU in proportion to memory, and the init phase is CPU-bound. A function with 1,024 MB often starts much faster than the same code with 256 MB, and may not cost more, since it also finishes sooner.
- **Do less at startup.** Create SDK clients and `HttpClient`s once, outside the handler, so warm invocations reuse them. But don't load data or open connections the first request might not need.
- **Precompile with ReadyToRun.** `<PublishReadyToRun>true</PublishReadyToRun>` ships ahead-of-time compiled code next to the IL, so the JIT has less to do at startup. It makes the package bigger and has to be built for the target platform (`linux-x64` or `linux-arm64`), but it's a flag, not a rewrite.
- **Prefer source-generated JSON.** Reflection-based serialization pays a warm-up cost on first use. `System.Text.Json` source generation moves that work to compile time, and you'll need it anyway if you go to Native AOT.

## SnapStart: skip the init phase

With [SnapStart](https://docs.aws.amazon.com/lambda/latest/dg/snapstart.html), Lambda runs your init code once, when you **publish a version**. It then takes a snapshot of the execution environment's memory and disk, and caches it. New execution environments resume from that snapshot instead of starting from scratch. You keep the regular managed runtime and your existing code, reflection and all.

In a SAM template it's two properties: SnapStart itself, and an alias so that every deployment publishes a version:

```yaml
Resources:
  OrdersFunction:
    Type: AWS::Serverless::Function
    Properties:
      Runtime: dotnet10
      Handler: Orders::Orders.Function::Handle
      MemorySize: 1024
      AutoPublishAlias: live
      SnapStart:
        ApplyOn: PublishedVersions
```

The snapshot captures whatever your code has done by the time init ends. Two runtime hooks in `Amazon.Lambda.Core` let you control that. **Before the snapshot**, run the hot path so it's already JIT-compiled in the snapshot. **After a restore**, regenerate anything that must be unique:

```csharp
using System.Text.Json;
using Amazon.Lambda.Core;

[assembly: LambdaSerializer(typeof(Amazon.Lambda.Serialization.SystemTextJson.DefaultLambdaJsonSerializer))]

namespace Orders;

public record Order(string Id, decimal[] Items);
public record Receipt(string OrderId, decimal Total, string ProcessedBy);

public class Function
{
    private static string _environmentId = Guid.NewGuid().ToString("N");

    public Function()
    {
        SnapshotRestore.RegisterBeforeSnapshot(() =>
        {
            // Run the hot path (JSON and pricing) so it's JIT-compiled
            // before the snapshot. No calls to other systems here.
            var sample = JsonSerializer.Deserialize<Order>("""{"Id":"warm-up","Items":[1.5,2]}""")!;
            for (var i = 0; i < 10; i++)
                JsonSerializer.Serialize(Process(sample));
            return ValueTask.CompletedTask;
        });

        SnapshotRestore.RegisterAfterRestore(() =>
        {
            // Every environment restored from the snapshot starts with the
            // same memory: regenerate anything that must be unique.
            _environmentId = Guid.NewGuid().ToString("N");
            return ValueTask.CompletedTask;
        });
    }

    public Receipt Handle(Order order, ILambdaContext context) => Process(order);

    private static Receipt Process(Order order) =>
        new(order.Id, order.Items.Sum(), _environmentId);
}
```

That second hook is the part people miss. Many environments can be restored from **the same snapshot**, so anything created during init is identical in all of them: IDs, random number generators seeded at startup, cached credentials, even open network connections, which may be stale when the environment resumes. Create those after the restore, or lazily on first use.

The trade-offs:

- SnapStart only applies to **published versions** and the aliases that point to them, never to `$LATEST`.
- It can't be combined with **provisioned concurrency**, **Amazon EFS**, or ephemeral storage above 512 MB.
- Unlike SnapStart for Java, **the .NET version isn't free**: you pay to cache the snapshot while the version is active and for each restore. The pricing page has the numbers for your Region.
- After-restore hooks must finish within the restore timeout, so keep them short.

## Native AOT: no JIT at all

[Native AOT](https://learn.microsoft.com/dotnet/core/deploying/native-aot/) compiles your function into a self-contained native executable. There's no JIT and no IL to load, so it starts fast and uses less memory. The official Lambda template turns it on with a few properties:

```xml
<PropertyGroup>
  <OutputType>Exe</OutputType>
  <TargetFramework>net10.0</TargetFramework>
  <PublishAot>true</PublishAot>
  <StripSymbols>true</StripSymbols>
  <TrimMode>partial</TrimMode>
</PropertyGroup>
```

Because the output is an executable, the function has a `Main` that starts the Lambda runtime client itself. JSON goes through a source-generated serializer context instead of reflection:

```csharp
using System.Text.Json.Serialization;
using Amazon.Lambda.Core;
using Amazon.Lambda.RuntimeSupport;
using Amazon.Lambda.Serialization.SystemTextJson;

Func<Order, ILambdaContext, Receipt> handler = (order, context) =>
    new Receipt(order.Id, order.Items.Sum());

await LambdaBootstrapBuilder
    .Create(handler, new SourceGeneratorLambdaJsonSerializer<OrdersJsonContext>())
    .Build()
    .RunAsync();

public record Order(string Id, decimal[] Items);
public record Receipt(string OrderId, decimal Total);

[JsonSerializable(typeof(Order))]
[JsonSerializable(typeof(Receipt))]
public partial class OrdersJsonContext : JsonSerializerContext;
```

The price is paid at build time and in your dependencies:

- **Everything must survive trimming.** Code that relies on reflection, such as some serializers, DI conventions and older libraries, can fail at runtime with missing types. Treat every trim or AOT warning as a bug. The template uses `TrimMode` `partial` because the AWS SDK for .NET isn't fully trim-safe.
- **You build for the target platform.** A native executable is tied to its OS and architecture, so it must be built on Amazon Linux 2023. The Lambda tooling (`Amazon.Lambda.Tools`, SAM) does that in a container, which means Docker on your machine and in CI.
- **Builds are slower.** Native compilation takes much longer than a regular build.

## Or pay to keep them warm

**Provisioned concurrency** keeps a number of environments initialized and ready. There's no cold start for traffic within that number, but you pay for those environments whether or not they're used. It suits steady, latency-critical workloads, and it can't be combined with SnapStart.

## Which one when

| Situation | What I'd reach for |
| --- | --- |
| Cold starts are rare, or a few hundred milliseconds don't matter | The cheap fixes: more memory, ReadyToRun, less work at startup |
| An existing function with ASP.NET Core, EF Core or reflection-heavy libraries | SnapStart, with warm-up and after-restore hooks |
| A new, focused function with few dependencies | Native AOT |
| Steady traffic with a strict latency target | Provisioned concurrency |

Whatever you choose, go back to the `@initDuration` query afterwards. It's the only way to know the change was worth it.

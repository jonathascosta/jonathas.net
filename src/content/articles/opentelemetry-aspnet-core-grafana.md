---
title: "Observability for ASP.NET Core with OpenTelemetry and Grafana, Starting on Your Laptop"
description: "Traces, metrics and logs from an ASP.NET Core API into Grafana, with one Docker container and a few lines of setup. Then the dashboards and queries that answer the questions you'll actually have in production."
pubDate: 2026-09-29
heroImage: ../../assets/images/articles/opentelemetry-aspnet-core-grafana.webp
heroAlt: "Diagram of the setup: an ASP.NET Core API sends traces, metrics and logs over OTLP to the OpenTelemetry Collector, which stores them in Tempo, Prometheus and Loki, all shown in Grafana"
tags: [.NET, ASP.NET Core, OpenTelemetry, Grafana, Observability]
---

A few years ago, adding monitoring to a .NET service meant picking a vendor and installing its SDK. Moving to another vendor meant instrumenting everything again. [OpenTelemetry](https://opentelemetry.io/) changed that: you instrument once, with vendor-neutral APIs, and send the data over one protocol (OTLP) to whatever backend you like. .NET is in a particularly good position here. The runtime's own `ActivitySource` and `Meter` types are the OpenTelemetry APIs, and ASP.NET Core already emits traces and metrics with them.

Here's the setup I'd use for an ASP.NET Core API: working locally in minutes, and ready for a real backend later.

## A complete backend in one container

Grafana publishes [`grafana/otel-lgtm`](https://github.com/grafana/docker-otel-lgtm), a single image with the OpenTelemetry Collector, Prometheus for metrics, Tempo for traces, Loki for logs, Pyroscope for profiles, and Grafana on top, already wired together:

```bash
docker run --name lgtm -p 3000:3000 -p 4317:4317 -p 4318:4318 --rm -it grafana/otel-lgtm
```

Port `4317` receives OTLP over gRPC, `4318` receives OTLP over HTTP, and Grafana is at `http://localhost:3000` (user `admin`, password `admin`). The image is meant for development, demos and tests. In production you'd point the same app at Grafana Cloud or your own collector, which is only a configuration change.

## Instrument the API

Add the OpenTelemetry packages: the hosting integration, the OTLP exporter, and instrumentation for ASP.NET Core, `HttpClient` and the .NET runtime:

```bash
dotnet package add OpenTelemetry.Extensions.Hosting
dotnet package add OpenTelemetry.Exporter.OpenTelemetryProtocol
dotnet package add OpenTelemetry.Instrumentation.AspNetCore
dotnet package add OpenTelemetry.Instrumentation.Http
dotnet package add OpenTelemetry.Instrumentation.Runtime
```

Then register everything in `Program.cs`:

```csharp
using System.Diagnostics;
using System.Diagnostics.Metrics;
using OpenTelemetry;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService("orders-api"))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddSource(Telemetry.Name))
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddMeter(Telemetry.Name))
    .UseOtlpExporter();
```

A few details that save time:

- **`AddService("orders-api")`** sets the service name that every span, metric and log carries. It's how you find your service in Grafana, so pick it carefully. You can also set it with the `OTEL_SERVICE_NAME` environment variable.
- **`UseOtlpExporter()`** sends all three signals, **traces, metrics and logs**, to one OTLP endpoint. `ILogger` output goes along without extra setup.
- **The defaults match the container.** The .NET exporter uses gRPC on `http://localhost:4317` unless told otherwise. Anywhere else, set `OTEL_EXPORTER_OTLP_ENDPOINT` (and `OTEL_EXPORTER_OTLP_PROTOCOL` if the backend wants `http/protobuf`) instead of hard-coding them.

Run the API, send it a few requests, and open **Explore** in Grafana: incoming requests appear as traces in Tempo, with any outgoing `HttpClient` calls nested inside them.

## Add what only your code knows

The built-in instrumentation tells you *that* `POST /orders` took 800 ms. Your own telemetry tells you *why*. There's no OpenTelemetry-specific API to learn for this: you use `ActivitySource` for spans and `Meter` for metrics from `System.Diagnostics`. That's also why `AddSource` and `AddMeter` above use the same name:

```csharp
static class Telemetry
{
    public const string Name = "Orders.Api";
    public static readonly ActivitySource Source = new(Name);
    public static readonly Meter Meter = new(Name);
    public static readonly Counter<long> OrdersPlaced =
        Meter.CreateCounter<long>("orders.placed", unit: "{order}", description: "Orders placed");
}
```

In the endpoint, start a span around the interesting work, count the business event, and log with a message template:

```csharp
app.MapPost("/orders", (Order order, ILogger<Program> logger) =>
{
    using var activity = Telemetry.Source.StartActivity("PlaceOrder");
    activity?.SetTag("order.items", order.Items.Length);

    var id = Guid.NewGuid();
    Telemetry.OrdersPlaced.Add(1, new KeyValuePair<string, object?>("payment.method", order.PaymentMethod));
    logger.LogInformation("Placed order {OrderId} with {ItemCount} items", id, order.Items.Length);

    return Results.Created($"/orders/{id}", new { id });
});
```

Three habits pay off here:

- **Log with templates, not string interpolation.** `{OrderId}` and `{ItemCount}` become separate attributes in Loki, so you can filter on them. `$"Placed order {id}"` is just text.
- **Logs written inside a span carry its trace ID.** In Grafana, a trace links to its logs and a log line links back to its trace. That's the fastest way from "this request was slow" to "this is what it was doing".
- **Keep attribute values low-cardinality on metrics.** `payment.method` has a handful of values, so it's a good metric attribute. A customer ID would create a time series per customer: put that on the span instead.

## Questions you can answer now

ASP.NET Core records every request in the `http.server.request.duration` histogram. In Prometheus it becomes `http_server_request_duration_seconds`, and the `grafana/otel-lgtm` image comes with a *RED Metrics* dashboard (rate, errors, duration) built on it. Two queries worth keeping:

**p95 latency per route:**

```text
histogram_quantile(0.95,
  sum by (le, http_route) (
    rate(http_server_request_duration_seconds_bucket{job="orders-api"}[5m])))
```

**Share of requests that fail with a 5xx:**

```text
sum(rate(http_server_request_duration_seconds_count{job="orders-api", http_response_status_code=~"5.."}[5m]))
/
sum(rate(http_server_request_duration_seconds_count{job="orders-api"}[5m]))
```

Your own counter shows up as `orders_placed_total`, so `sum by (payment_method) (rate(orders_placed_total[5m]))` charts orders per payment method.

These are also the queries to alert on. Alert on symptoms your users feel, such as latency and errors per route, rather than on CPU. Then use traces and logs to find the cause.

## From laptop to production

Nothing in the code changes between environments. Only configuration does:

- Point `OTEL_EXPORTER_OTLP_ENDPOINT` at an OpenTelemetry Collector or at your vendor's OTLP endpoint. With a collector in between, you can add batching, filtering and routing without redeploying services.
- Add resource attributes such as `deployment.environment.name` and `service.version`, for example through `OTEL_RESOURCE_ATTRIBUTES`, so dashboards can separate staging from production and one release from the next.
- Sample traces when the volume grows, but keep metrics complete: they're cheap, and they're what your alerts read.

The result is a service you can observe with any OpenTelemetry-compatible tool: Grafana today, something else tomorrow, without touching the instrumentation again.

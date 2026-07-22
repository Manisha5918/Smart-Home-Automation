using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Helpers;
using SmartHomeAutomation.Hubs;
using SmartHomeAutomation.Middleware;
using SmartHomeAutomation.Services;
using System.Text;
using System.Threading.RateLimiting;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

builder.Services.AddScoped<AISuggestionService>();

builder.Services.AddEndpointsApiExplorer();

builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc(
        "v1",
        new OpenApiInfo
        {
            Title = "SmartHomeAutomation API",
            Version = "v1"
        });

    options.AddSecurityDefinition(
        "Bearer",
        new OpenApiSecurityScheme
        {
            Name = "Authorization",
            Type = SecuritySchemeType.Http,
            Scheme = "Bearer",
            BearerFormat = "JWT",
            In = ParameterLocation.Header,
            Description =
                "Enter your JWT token."
        });

    options.AddSecurityRequirement(
        new OpenApiSecurityRequirement
        {
            {
                new OpenApiSecurityScheme
                {
                    Reference = new OpenApiReference
                    {
                        Type =
                            ReferenceType.SecurityScheme,

                        Id = "Bearer"
                    }
                },

                Array.Empty<string>()
            }
        });
});

builder.Services.AddDbContext<ApplicationDbContext>(
    options =>
        options.UseMySql(
            builder.Configuration
                .GetConnectionString(
                    "DefaultConnection"),

            ServerVersion.AutoDetect(
                builder.Configuration
                    .GetConnectionString(
                        "DefaultConnection"))
        ));

builder.Services.AddScoped<JwtService>();

builder.Services.AddScoped<AutomationRuleService>();

builder.Services.AddScoped<EnergyAnomalyService>();

builder.Services.AddScoped<PredictiveMaintenanceService>();

builder.Services.AddScoped<EnergyAdvisorService>();

builder.Services.AddScoped<DeviceHealthService>();

builder.Services.AddScoped<AIAutomationSuggestionService>();

builder.Services.AddHostedService<AutomationSchedulerService>();

builder.Services.AddScoped<RoutineLearningService>();

builder.Services.AddScoped<AISuggestionService>();

builder.Services.AddScoped<HomeIntelligenceService>();

builder.Services.AddScoped<MonthlyReportService>();
builder.Services.AddScoped<AIExplainabilityService>();

builder.Services.AddHttpClient<TranslationService>();

builder.Services.AddMemoryCache();
builder.Services.AddHttpClient<IWeatherService, WeatherService>();



builder.Services.AddScoped<MemoryService>();
builder.Services.AddScoped<AIAssistantService>();
builder.Services.AddScoped<ReportGenerationService>();

builder.Services.AddScoped<SecurityRiskService>();

builder.Services.AddScoped<CommandParserService>();

builder.Services.AddScoped<EmailTemplateService>();

builder.Services.AddScoped<IEmailService, EmailService>();

builder.Services.AddScoped<SecurityEventService>();

builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
    });

builder.Services.AddScoped<IRealTimeNotificationService, RealTimeNotificationService>();

builder.Services.AddHttpClient<OllamaService>(
    (serviceProvider, client) =>
    {
        var configuration =
            serviceProvider.GetRequiredService<IConfiguration>();

        var baseUrl =
            configuration["Ollama:BaseUrl"];

        if (string.IsNullOrWhiteSpace(baseUrl))
        {
            throw new InvalidOperationException(
                "Ollama BaseUrl is not configured.");
        }

        client.BaseAddress = new Uri(baseUrl);

        client.Timeout = TimeSpan.FromMinutes(10);
    });

builder.Services.AddCors(options =>
{
    options.AddPolicy(
        "ReactApp",
        policy =>
        {
            policy
                .WithOrigins(
                    builder.Configuration["App:BaseUrl"] ?? "http://localhost:5173")
                .WithHeaders("Authorization", "Content-Type", "Accept", "X-Requested-With")
                .WithMethods("GET", "POST", "PUT", "PATCH", "DELETE")
                .AllowCredentials()
                .SetPreflightMaxAge(TimeSpan.FromMinutes(10));
        });
});

builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = 429;
    options.AddFixedWindowLimiter("Api", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromMinutes(1);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 5;
    });
});

builder.Services
    .AddAuthentication(
        JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,

                ValidateAudience = true,

                ValidateLifetime = true,

                ValidateIssuerSigningKey = true,

                ValidIssuer =
                    builder.Configuration[
                        "Jwt:Issuer"],

                ValidAudience =
                    builder.Configuration[
                        "Jwt:Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(
                            builder.Configuration[
                                "Jwt:Key"]!
                        ))
            };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    (path.StartsWithSegments("/hubs/notifications") ||
                     path.StartsWithSegments("/hubs/dashboard")))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

var app = builder.Build();

app.UseGlobalExceptionMiddleware();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.Use(async (context, next) =>
{
    context.Response.Headers.Append("X-Content-Type-Options", "nosniff");
    context.Response.Headers.Append("X-Frame-Options", "DENY");
    context.Response.Headers.Append("X-XSS-Protection", "1; mode=block");
    context.Response.Headers.Append("Referrer-Policy", "strict-origin-when-cross-origin");
    context.Response.Headers.Append("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    await next();
});

app.UseHttpsRedirection();
app.UseRateLimiter();

app.UseCors("ReactApp");

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.MapHub<NotificationHub>("/hubs/notifications");
app.MapHub<DashboardHub>("/hubs/dashboard");

app.Run();

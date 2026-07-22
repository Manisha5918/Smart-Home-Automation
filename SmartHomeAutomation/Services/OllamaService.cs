using System.Net.Http.Json;
using System.Text.Json;
using System.Runtime.CompilerServices;

namespace SmartHomeAutomation.Services
{
    public class OllamaService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;

        public OllamaService(
            HttpClient httpClient,
            IConfiguration configuration)
        {
            _httpClient = httpClient;
            _configuration = configuration;
        }

        public async Task<string> ChatAsync(
            string systemPrompt,
            string userMessage,
            CancellationToken cancellationToken = default)
        {
            var model = _configuration["Ollama:Model"];

            if (string.IsNullOrWhiteSpace(model))
            {
                throw new InvalidOperationException(
                    "Ollama model is not configured.");
            }

            var request = new
            {
                model,

                messages = new object[]
                {
                    new
                    {
                        role = "system",
                        content = systemPrompt
                    },

                    new
                    {
                        role = "user",
                        content = userMessage
                    }
                },

                stream = false,
                keep_alive = "30m"
            };

            var response = await _httpClient.PostAsJsonAsync(
                "/api/chat",
                request,
                cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                var errorContent =
                    await response.Content.ReadAsStringAsync(cancellationToken);

                throw new InvalidOperationException(
                    $"Ollama request failed: {errorContent}");
            }

            using var jsonDocument =
                JsonDocument.Parse(
                    await response.Content.ReadAsStringAsync(cancellationToken));

            var content = jsonDocument
                .RootElement
                .GetProperty("message")
                .GetProperty("content")
                .GetString();

            return content ?? string.Empty;
        }

        public async IAsyncEnumerable<string> StreamChatAsync(
            string systemPrompt,
            string userMessage,
            [EnumeratorCancellation] CancellationToken cancellationToken = default)
        {
            var model = _configuration["Ollama:Model"];

            if (string.IsNullOrWhiteSpace(model))
            {
                throw new InvalidOperationException("Ollama model is not configured.");
            }

            var request = new
            {
                model,
                messages = new object[]
                {
                    new { role = "system", content = systemPrompt },
                    new { role = "user", content = userMessage }
                },
                stream = true,
                keep_alive = "30m"
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync("/api/chat", content, cancellationToken);
            response.EnsureSuccessStatusCode();

            using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
            using var reader = new StreamReader(stream);

            while (!reader.EndOfStream && !cancellationToken.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync();
                if (string.IsNullOrWhiteSpace(line)) continue;

                JsonDocument doc = null;
                try
                {
                    doc = JsonDocument.Parse(line);
                }
                catch
                {
                    continue;
                }

                using (doc)
                {
                    var done = doc.RootElement.GetProperty("done").GetBoolean();
                    var chunk = doc.RootElement.GetProperty("message").GetProperty("content").GetString();
                    if (!string.IsNullOrEmpty(chunk))
                    {
                        yield return chunk;
                    }
                    if (done) break;
                }
            }
        }
    }
}
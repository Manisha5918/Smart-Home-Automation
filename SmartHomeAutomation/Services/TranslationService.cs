using System.Text;
using System.Text.Json;

namespace SmartHomeAutomation.Services
{
    public class TranslationService
    {
        private readonly HttpClient _httpClient;

        public TranslationService(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task<string> TranslateAsync(
            string text,
            string targetLanguage)
        {
            var language = targetLanguage.ToLower() switch
            {
                "ta" => "Tamil",
                "ml" => "Malayalam",
                "hi" => "Hindi",
                "en" => "English",
                _ => "English"
            };

            if (language == "English")
            {
                return text;
            }

            var prompt = $"""
                Translate the following smart home text from English to {language}.

                Return only the translated text.
                Do not explain the translation.
                Preserve device names.
                Preserve numbers.
                Preserve units such as W, kW, kWh, CO2 and ₹.

                Text:
                {text}
                """;

            var request = new
            {
                model = "qwen3:4b",
                prompt = prompt,
                stream = false
            };

            var json = JsonSerializer.Serialize(request);

            var content = new StringContent(
                json,
                Encoding.UTF8,
                "application/json"
            );

            var response = await _httpClient.PostAsync(
                "http://localhost:11434/api/generate",
                content
            );

            response.EnsureSuccessStatusCode();

            var result = await response.Content.ReadAsStringAsync();

            using var document = JsonDocument.Parse(result);

            return document.RootElement
                .GetProperty("response")
                .GetString()?
                .Trim() ?? text;
        }
    }
}
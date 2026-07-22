using Microsoft.AspNetCore.Mvc;
using SmartHomeAutomation.Services;

namespace SmartHomeAutomation.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class TranslationController : ControllerBase
    {
        private readonly TranslationService _translationService;

        public TranslationController(
            TranslationService translationService)
        {
            _translationService = translationService;
        }

        [HttpPost("translate")]
        public async Task<IActionResult> Translate(
            [FromBody] TranslationRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Text))
            {
                return BadRequest(new { message = "Text is required." });
            }

            if (string.IsNullOrWhiteSpace(request.TargetLanguage))
            {
                return BadRequest(new { message = "Target language is required." });
            }

            try
            {
                var translatedText = await _translationService.TranslateAsync(request.Text, request.TargetLanguage);
                return Ok(new { originalText = request.Text, targetLanguage = request.TargetLanguage, translatedText });
            }
            catch (HttpRequestException)
            {
                return StatusCode(503, new { message = "Ollama translation service is unavailable." });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Translation failed." });
            }
        }

        [HttpPost("batch")]
        public async Task<IActionResult> BatchTranslate([FromBody] BatchTranslationRequest request)
        {
            if (request.Texts == null || request.Texts.Count == 0)
                return BadRequest(new { message = "Texts list is required." });

            if (string.IsNullOrWhiteSpace(request.TargetLanguage))
                return BadRequest(new { message = "Target language is required." });

            try
            {
                var chunkSize = 10;
                var results = new Dictionary<string, string>();
                var toProcess = new List<(string Key, string Text)>();

                foreach (var entry in request.Texts)
                {
                    var key = entry.Key ?? entry.Text;
                    toProcess.Add((key, entry.Text));
                }

                for (int i = 0; i < toProcess.Count; i += chunkSize)
                {
                    var chunk = toProcess.Skip(i).Take(chunkSize).ToList();
                    var combinedText = string.Join("\n---\n", chunk.Select(x => x.Text));
                    var translatedChunk = await _translationService.TranslateAsync(combinedText, request.TargetLanguage);
                    var lines = translatedChunk.Split("\n---\n", StringSplitOptions.TrimEntries);

                    for (int j = 0; j < chunk.Count; j++)
                    {
                        var translated = j < lines.Length ? lines[j] : chunk[j].Text;
                        results[chunk[j].Key] = string.IsNullOrWhiteSpace(translated) ? chunk[j].Text : translated;
                    }
                }

                return Ok(new { translations = results, targetLanguage = request.TargetLanguage });
            }
            catch (HttpRequestException)
            {
                return StatusCode(503, new { message = "Ollama translation service is unavailable." });
            }
            catch (Exception)
            {
                return StatusCode(500, new { message = "Batch translation failed." });
            }
        }
    }

    public class TranslationRequest
    {
        public string Text { get; set; } = string.Empty;
        public string TargetLanguage { get; set; } = string.Empty;
    }

    public class BatchTranslationRequest
    {
        public List<TranslationEntry> Texts { get; set; } = new();
        public string TargetLanguage { get; set; } = string.Empty;
    }

    public class TranslationEntry
    {
        public string Key { get; set; } = string.Empty;
        public string Text { get; set; } = string.Empty;
    }
}
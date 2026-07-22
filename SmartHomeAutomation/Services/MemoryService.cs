using Microsoft.EntityFrameworkCore;
using SmartHomeAutomation.Data;
using SmartHomeAutomation.Models;

namespace SmartHomeAutomation.Services
{
    public class MemoryService
    {
        private readonly ApplicationDbContext _context;

        public MemoryService(ApplicationDbContext context)
        {
            _context = context;
        }

        // Save a user or assistant message
        public async Task SaveMessageAsync(
            int userId,
            string role,
            string message)
        {
            var memory = new ConversationMemory
            {
                UserId = userId,
                Role = role,
                Message = message,
                CreatedAt = DateTime.UtcNow
            };

            _context.ConversationMemories.Add(memory);
            await _context.SaveChangesAsync();
        }

        // Get the last N messages
        public async Task<List<ConversationMemory>> GetRecentMessagesAsync(
            int userId,
            int count = 10)
        {
            return await _context.ConversationMemories
                .Where(x => x.UserId == userId)
                .OrderByDescending(x => x.CreatedAt)
                .Take(count)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();
        }

        // Build conversation history for AI
        public async Task<string> GetConversationHistoryAsync(
            int userId,
            int count = 10)
        {
            var messages = await GetRecentMessagesAsync(userId, count);

            return string.Join(
                "\n",
                messages.Select(m =>
                    $"{m.Role}: {m.Message}")
            );
        }

        // Clear chat history
        public async Task ClearConversationAsync(int userId)
        {
            var memories = await _context.ConversationMemories
                .Where(x => x.UserId == userId)
                .ToListAsync();

            _context.ConversationMemories.RemoveRange(memories);

            await _context.SaveChangesAsync();
        }
    }
}